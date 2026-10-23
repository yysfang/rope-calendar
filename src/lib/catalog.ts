import { z } from 'zod';

const safeUrl = z.string().url().refine(value => {
  const url = new URL(value);
  return ['https:','http:'].includes(url.protocol) && !url.username && !url.password && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[::1\])/.test(url.hostname);
}, '需要有效的官方网页地址');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, '日期不存在');
export const documentSchema = z.object({
  title: z.string().min(1).max(200), url: safeUrl,
  localPath: z.string().regex(/^\/(regulations|api\/files)\/[a-zA-Z0-9_-][a-zA-Z0-9_\-.]*\.(pdf|docx?|html)$/i).optional(),
  format: z.enum(['PDF', 'DOCX', 'DOC', 'HTML']),
  kind: z.enum(['regulation', 'handbook', 'rules']), note: z.string().max(500).optional(),
});
export const eventSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), title: z.string().min(2).max(200),
  level: z.enum(['国际', '全国', '省级']), system: z.enum(['国际', '体育', '教育']),
  province: z.string().max(30), city: z.string().max(80), venue: z.string().max(200),
  startDate: date.nullable(), endDate: date.nullable(),
  dateStatus: z.enum(['confirmed', 'planned']), dateLabel: z.string().max(100).optional(),
  scheduleType: z.enum(['competition','event-period']).optional(),
  registrationDeadline: date.nullable(), registrationStartDate: date.nullable().optional(),
  organizer: z.string().max(300), summary: z.string().max(1600), eligibility: z.string().max(800),
  sourceName: z.string().min(1).max(100), sourceUrl: safeUrl,
  documents: z.array(documentSchema).max(15),
  year: z.number().int().min(2020).max(2100).optional(),
  status: z.enum(['normal', 'cancelled', 'postponed']).optional(),
  scheduleNote: z.string().max(600).optional(),
}).superRefine((event, ctx) => {
  if (event.endDate && event.startDate && event.endDate < event.startDate)
    ctx.addIssue({code:'custom',message:'结束日期早于开始日期',path:['endDate']});
  if (event.dateStatus === 'confirmed' && !event.startDate)
    ctx.addIssue({code:'custom',message:'已确认比赛需要开始日期',path:['startDate']});
  if (event.endDate && !event.startDate)
    ctx.addIssue({code:'custom',message:'结束日期需要配套开始日期',path:['endDate']});
});
export const catalogSchema = z.object({
  events: z.array(eventSchema).max(2000),
  reviewedAt: z.string().datetime(), updateNote: z.string().max(1000), coverageNote: z.string().max(1000),
  sources: z.array(z.object({name:z.string(),url:safeUrl,category:z.string(),note:z.string().optional()})).max(300),
  schedule: z.object({enabled:z.boolean(),time:z.string().optional(),timezone:z.string().optional()}),
}).superRefine((catalog, ctx) => {
  const unique = new Set(catalog.events.map(event => event.id));
  if (unique.size !== catalog.events.length) ctx.addIssue({code:'custom',message:'赛事记录重复'});
});
export type RopeEvent = z.infer<typeof eventSchema>;
export type Regulation = z.infer<typeof documentSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Filters = {query?:string; level?:string; province?:string; year?:string; timeline?:string};
export const eventLevelOrder = ['国际','全国','省级'] as const;
const provinceOrder = ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆','香港','澳门','台湾'];
export function validateCatalog(input: unknown) { return catalogSchema.safeParse(input); }
export function todayShanghai() {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
export function eventStatus(event: RopeEvent, today = todayShanghai()): {label:string;tone:string} {
  if (event.status === 'cancelled') return {label:'已取消',tone:'gray'};
  if (event.status === 'postponed') return {label:'已延期',tone:'amber'};
  if (event.dateStatus === 'planned' || !event.startDate) return {label:'赛期待定',tone:'amber'};
  if ((event.endDate || event.startDate) < today) return {label:'已结束',tone:'gray'};
  if (event.startDate <= today) return {label:'进行中',tone:'green'};
  if (event.registrationStartDate && event.registrationStartDate > today) return {label:'报名未开始',tone:'blue'};
  if (event.registrationDeadline && event.registrationDeadline < today) return {label:'报名已截止',tone:'gray'};
  if (event.registrationDeadline) return {label:'报名中',tone:'green'};
  return {label:'即将举行',tone:'blue'};
}
export function filterEvents(events: RopeEvent[], filters: Filters, today = todayShanghai()): RopeEvent[] {
  const searchable = (value:string) => value.trim().toLocaleLowerCase().replaceAll('段位挑战赛','段位赛');
  const q = searchable(filters.query || '');
  return events.filter(event => {
    const past = !!event.startDate && (event.endDate || event.startDate) < today;
    if (filters.timeline === 'upcoming' && (past || event.status === 'cancelled')) return false;
    if (filters.timeline === 'past' && !past) return false;
    if (filters.level && event.level !== filters.level) return false;
    if (filters.province && event.province !== filters.province) return false;
    if (filters.year) {
      const startYear = Number(event.startDate?.slice(0,4) || event.year);
      const endYear = Number(event.endDate?.slice(0,4) || startYear);
      if (!(Number(filters.year) >= startYear && Number(filters.year) <= endYear)) return false;
    }
    if (q && !searchable([event.title,event.province,event.city,event.venue,event.organizer,event.summary].join(' ')).includes(q)) return false;
    return true;
  }).sort((a,b) => {
    const levelDifference=eventLevelOrder.indexOf(a.level)-eventLevelOrder.indexOf(b.level);
    if(levelDifference)return levelDifference;
    if(a.level==='省级' && a.province!==b.province){
      const provinceRank=(province:string)=>{const index=provinceOrder.indexOf(province);return index<0?provinceOrder.length:index;};
      const provinceDifference=provinceRank(a.province)-provinceRank(b.province);
      if(provinceDifference)return provinceDifference;
      return a.province.localeCompare(b.province,'zh');
    }
    if (!a.startDate) return b.startDate ? 1 : a.title.localeCompare(b.title,'zh');
    if (!b.startDate) return -1;
    return filters.timeline === 'past' ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate);
  });
}
export function groupEventsForBrowsing(events:RopeEvent[]) {
  return eventLevelOrder.map(level=>{
    const records=events.filter(event=>event.level===level);
    const months=new Map<string,RopeEvent[]>();
    for(const event of records){
      const month=event.status==='cancelled'?'已取消':event.startDate?`${event.startDate.slice(0,4)}年 ${Number(event.startDate.slice(5,7))}月`:'赛期待定';
      const label=level==='省级'?`${event.province} · ${month}`:month;
      const group=months.get(label)||[];group.push(event);months.set(label,group);
    }
    return {level,label:level==='省级'?'各省赛事':`${level}赛事`,count:records.length,months:[...months].map(([label,events])=>({label,events}))};
  }).filter(group=>group.count>0);
}
export function dateLabel(event: RopeEvent): string {
  if (event.dateLabel) return event.dateLabel;
  if (!event.startDate) return '比赛日期待公布';
  const [y,m,d] = event.startDate.split('-').map(Number);
  if (!event.endDate || event.endDate === event.startDate) return `${y}年${m}月${d}日`;
  const [ey,em,ed] = event.endDate.split('-').map(Number);
  if (y !== ey) return `${y}年${m}月${d}日—${ey}年${em}月${ed}日`;
  if (m !== em) return `${y}年${m}月${d}日—${em}月${ed}日`;
  return `${y}年${m}月${d}—${ed}日`;
}
export function eventPresentation(event: RopeEvent) {
  return {title:event.title,date:dateLabel(event),location:[event.province,event.city,event.venue].filter((v,i,a)=>v && a.indexOf(v)===i).join(' · '),organizer:event.organizer,summary:event.summary,eligibility:event.eligibility,sourceName:event.sourceName,sourceUrl:event.sourceUrl};
}
export function calendarEligible(event: RopeEvent) {
  return event.dateStatus === 'confirmed' && event.scheduleType !== 'event-period' && !!event.startDate && event.status !== 'cancelled' && event.status !== 'postponed';
}
export function eventsOnDate(events:RopeEvent[],date:string) {
  return events.filter(event=>calendarEligible(event)&&event.startDate!<=date&&(event.endDate||event.startDate!)>=date);
}
const escapeICS = (text:string) => text.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r/g,'');
function foldICS(line:string) {
  const encoder=new TextEncoder(); let result='',part='',size=0;
  for(const char of line) { const bytes=encoder.encode(char).length; if(size+bytes>73){result+=part+'\r\n ';part='';size=1;} part+=char;size+=bytes; }
  return result+part;
}
export function buildICS(events: RopeEvent[]): string {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Rope Calendar//ZH','CALSCALE:GREGORIAN','X-WR-CALNAME:绳历 · 跳绳赛事'];
  for (const event of events.filter(calendarEligible)) {
    const end = new Date((event.endDate || event.startDate) + 'T00:00:00Z');
    end.setUTCDate(end.getUTCDate()+1);
    const view=eventPresentation(event);
    lines.push('BEGIN:VEVENT',`UID:${event.id}@rope-calendar`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,`DTSTART;VALUE=DATE:${event.startDate!.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replace(/-/g,'')}`,`SUMMARY:${escapeICS(event.title)}`,`LOCATION:${escapeICS(view.location)}`,`DESCRIPTION:${escapeICS(`${event.summary}\n官方来源：${event.sourceName}\n${event.sourceUrl}\n${event.scheduleNote || ''}`)}`,`URL:${event.sourceUrl}`,'END:VEVENT');
  }
  return [...lines,'END:VCALENDAR'].map(foldICS).join('\r\n')+'\r\n';
}
