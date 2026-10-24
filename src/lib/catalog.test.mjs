import test from 'node:test';
import assert from 'node:assert/strict';
import { eventStatus, filterEvents, groupEventsForBrowsing, buildICS, validateCatalog, eventPresentation, eventsOnDate, dateLabel, filtersForMonth } from './catalog.ts';

const event = { id:'internal-event-key', title:'全国跳绳锦标赛', level:'全国', system:'体育', province:'江西', city:'赣州', venue:'安远县体育馆', startDate:'2026-11-06', endDate:'2026-11-08', dateStatus:'confirmed', registrationDeadline:'2026-10-15', organizer:'赛事主办方', summary:'跳绳比赛', eligibility:'以官方规程为准', sourceName:'体育总局', sourceUrl:'https://www.sport.gov.cn/example', documents:[], year:2026 };

test('a closed registration deadline does not mark a future competition as finished',()=>{
 assert.equal(eventStatus(event,'2026-10-22').label,'报名已截止');
 assert.equal(eventStatus(event,'2026-11-07').label,'进行中');
 assert.equal(eventStatus(event,'2026-11-09').label,'已结束');
});
test('unknown deadlines are not presented as open registration',()=>{
 assert.equal(eventStatus({...event,registrationDeadline:null},'2026-10-22').label,'即将举行');
 assert.equal(eventStatus({...event,startDate:null,endDate:null,dateStatus:'planned'},'2026-10-22').label,'赛期待定');
});
test('a published future registration window is not marked as open early',()=>{
 assert.equal(eventStatus({...event,registrationDeadline:'2027-03-15',registrationStartDate:'2026-12-15'},'2026-10-22').label,'报名未开始');
});
test('filters combine event level and location and search organizer',()=>{
 const education={...event,id:'education',system:'教育',level:'省级',province:'重庆',city:'重庆',organizer:'重庆市教育委员会'};
 assert.deepEqual(filterEvents([event,education],{level:'省级',province:'重庆',query:'教育委员会',timeline:'upcoming'},'2026-10-22').map(e=>e.id),['education']);
 assert.equal(filterEvents([event],{query:'不存在'},'2026-10-22').length,0);
});

test('browsing groups international, national and provincial races before ordering their dates',()=>{
 const records=[
  {...event,id:'jiangsu-later',level:'省级',province:'江苏',startDate:'2026-11-20',endDate:'2026-11-21'},
  {...event,id:'national-earlier',startDate:'2026-10-24',endDate:'2026-10-25'},
  {...event,id:'international-later',level:'国际',system:'国际',startDate:'2027-05-01',endDate:'2027-05-03'},
  {...event,id:'beijing',level:'省级',province:'北京',startDate:'2026-12-01',endDate:'2026-12-02'},
  {...event,id:'jiangsu-earlier',level:'省级',province:'江苏',startDate:'2026-11-01',endDate:'2026-11-02'},
 ];
 const ordered=filterEvents(records,{timeline:'upcoming'},'2026-10-23');
 assert.deepEqual(ordered.map(e=>e.id),['international-later','national-earlier','beijing','jiangsu-earlier','jiangsu-later']);
 const groups=groupEventsForBrowsing(ordered);
 assert.deepEqual(groups.map(g=>g.label),['国际赛事','全国赛事','各省赛事']);
 assert.deepEqual(groups[2].months.map(g=>g.label),['北京 · 2026年 12月','江苏 · 2026年 11月']);
 assert.deepEqual(groups[2].months[1].events.map(e=>e.id),['jiangsu-earlier','jiangsu-later']);
});

test('past races keep the same category priority with newest dates first within each province',()=>{
 const records=[{...event,id:'national'}, {...event,id:'international',level:'国际',system:'国际',startDate:'2026-04-01',endDate:'2026-04-02'}, {...event,id:'provincial-old',level:'省级',province:'江苏',startDate:'2026-05-01',endDate:'2026-05-02'}, {...event,id:'provincial-new',level:'省级',province:'江苏',startDate:'2026-06-01',endDate:'2026-06-02'}];
 assert.deepEqual(filterEvents(records,{timeline:'past'},'2026-12-01').map(e=>e.id),['international','national','provincial-new','provincial-old']);
});

test('cancelled stations are excluded from upcoming races and calendar export',()=>{
 const cancelled={...event,id:'cancelled-station',status:'cancelled',dateStatus:'planned',startDate:null,endDate:null};
 assert.equal(eventStatus(cancelled).label,'已取消');
 assert.equal(filterEvents([cancelled],{timeline:'upcoming'},'2026-10-23').length,0);
 assert.equal(filterEvents([cancelled],{timeline:'all'},'2026-10-23').length,1);
 assert.equal(groupEventsForBrowsing([cancelled])[0].months[0].label,'已取消');
 assert.doesNotMatch(buildICS([cancelled]),/BEGIN:VEVENT/);
});


test('ranking challenge events can be found by the common duanwei race name',()=>{
 const station={...event,title:'2026年全国跳绳段位挑战赛（海南站）'};
 for(const query of ['全国跳绳段位赛','段位赛','段位挑战赛']) {
  assert.equal(filterEvents([station],{query,timeline:'upcoming'},'2026-10-23').length,1);
 }
 assert.equal(filterEvents([event],{query:'段位赛'},'2026-10-23').length,0);
});
test('a cross-year event remains discoverable by either year and overlaps month boundary',()=>{
 const crossing={...event,startDate:'2026-12-30',endDate:'2027-01-03'};
 assert.equal(filterEvents([crossing],{year:'2027'},'2026-10-22').length,1);
});
test('month navigation includes every touched month across month and year boundaries',()=>{
 const crossing={...event,startDate:'2026-12-30',endDate:'2027-01-03'};
 for(const month of ['2026-12','2027-01']) assert.equal(filterEvents([crossing],{month},'2026-10-24').length,1);
 for(const month of ['2026-11','2027-02']) assert.equal(filterEvents([crossing],{month},'2026-10-24').length,0);
 const monthEnd={...event,startDate:'2026-10-30',endDate:'2026-11-02'};
 assert.equal(filterEvents([monthEnd],{month:'2026-11'},'2026-10-24').length,1);
 assert.equal(filterEvents([monthEnd],{month:'2026-12'},'2026-10-24').length,0);
 assert.equal(groupEventsForBrowsing([monthEnd],'2026-11')[0].months[0].label,'2026年 11月');
});
test('month navigation composes with existing filters without assigning unknown dates',()=>{
 const unknown={...event,id:'unknown',startDate:null,endDate:null,dateStatus:'planned',dateLabel:'计划2026年11月 · 具体日期待公布'};
 const cancelled={...event,id:'cancelled',status:'cancelled'};
 const previous={...event,id:'previous',startDate:'2026-09-01',endDate:'2026-09-02'};
 const records=[event,unknown,cancelled,previous];
 assert.deepEqual(filterEvents(records,{month:'2026-11',level:'全国',province:'江西',query:'锦标赛',timeline:'upcoming'},'2026-10-24').map(e=>e.id),[event.id]);
 assert.deepEqual(filterEvents(records,{month:'2026-09',timeline:'past'},'2026-10-24').map(e=>e.id),['previous']);
 assert.equal(filterEvents(records,{month:'2026-11',year:'2027'},'2026-10-24').length,0);
 assert.ok(filterEvents(records,{timeline:'upcoming'},'2026-10-24').some(e=>e.id==='unknown'));
});
test('selecting a month keeps ongoing boundary events and clearing restores undated upcoming events',()=>{
 const crossing={...event,startDate:'2026-10-31',endDate:'2026-11-01'};
 const unknown={...event,id:'unknown',startDate:null,endDate:null,dateStatus:'planned'};
 const selected=filtersForMonth({year:'2027',query:'锦标赛',level:'全国'},'2026-10');
 assert.equal(selected.year,'');
 assert.equal(selected.query,'锦标赛');
 assert.deepEqual(filterEvents([crossing,unknown],selected,'2026-11-01').map(e=>e.id),[event.id]);
 const cleared=filtersForMonth(selected,'');
 assert.equal(cleared.timeline,'upcoming');
 assert.deepEqual(filterEvents([crossing,unknown],cleared,'2026-11-01').map(e=>e.id),[event.id,'unknown']);
});
test('calendar export uses exclusive ending date and omits tentative events',()=>{
 const ics=buildICS([event,{...event,id:'tentative',dateStatus:'planned'}]);
 assert.match(ics,/DTEND;VALUE=DATE:20261109/);
 assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,1);
 const visible=ics.split('\r\n').filter(l=>/^(SUMMARY|DESCRIPTION|LOCATION):/.test(l)).join('\n');
 assert.doesNotMatch(visible,/internal-event-key/);
 assert.match(visible,/全国跳绳锦标赛/);
});
test('user-facing presentation never includes internal fields',()=>{
 const view=eventPresentation({...event,uuid:'secret-uuid',syncKey:'dedupe-secret',hash:'abc123'});
 assert.doesNotMatch(JSON.stringify(view),/internal-event-key|secret-uuid|dedupe-secret|abc123/);
 assert.equal(view.title,'全国跳绳锦标赛');
});
test('catalogue validation rejects unsafe links and impossible or inverted dates',()=>{
 const wrap=e=>({events:[e],reviewedAt:'2026-10-22T14:00:00Z',updateNote:'首次核查',coverageNote:'持续补充官方赛事',sources:[],schedule:{enabled:false}});
 assert.equal(validateCatalog(wrap(event)).success,true);
 assert.equal(validateCatalog(wrap({...event,sourceUrl:'javascript:alert(1)'})).success,false);
 assert.equal(validateCatalog(wrap({...event,startDate:'2026-02-30'})).success,false);
 assert.equal(validateCatalog(wrap({...event,endDate:'2026-11-01'})).success,false);
 assert.equal(validateCatalog(wrap({...event,documents:[{title:'规程',url:'https://safe.example/a',localPath:'//evil.example/file',format:'PDF',kind:'regulation'}]})).success,false);
});
test('validation rejects duplicate records and municipal events',()=>{
 const base={events:[event,event],reviewedAt:'2026-10-22T14:00:00Z',updateNote:'首次核查',coverageNote:'核查中',sources:[],schedule:{enabled:false}};
 assert.equal(validateCatalog(base).success,false);
 assert.equal(validateCatalog({...base,events:[{...event,level:'市级'}]}).success,false);
});
test('fixed calendar days exclude tentative, postponed, cancelled and arrival-inclusive windows',()=>{
 const records=[event,{...event,id:'planned',dateStatus:'planned'},{...event,id:'postponed',status:'postponed'},{...event,id:'cancelled',status:'cancelled'},{...event,id:'arrival-window',scheduleType:'event-period',dateLabel:'2026年11月6—8日（含报到）'}];
 assert.deepEqual(eventsOnDate(records,'2026-11-06').map(e=>e.id),['internal-event-key']);
 assert.equal(dateLabel(records[4]),'2026年11月6—8日（含报到）');
 assert.equal((buildICS(records).match(/BEGIN:VEVENT/g)||[]).length,1);
});
