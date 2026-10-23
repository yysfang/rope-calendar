import { useState } from 'react';
import { eventCover } from '@/lib/landmarks';
import type { RopeEvent } from '@/lib/catalog';

export default function EventCover({event}:{event:RopeEvent}) {
 const photo = eventCover(event);
 const [failed, setFailed] = useState(false);
 return <div className="event-cover" aria-hidden="true">
  {!failed && <picture>
   <source media="(max-width: 600px)" srcSet={photo.mobileSrc}/>
   <img src={photo.src} alt="" loading="lazy" decoding="async" width="1600" height="240" style={{objectPosition:photo.position}} onError={()=>setFailed(true)}/>
  </picture>}
 </div>;
}
