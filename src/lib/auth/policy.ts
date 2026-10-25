export type UserRole="athlete"|"trainer"|"admin";
export type Actor={id:string;email:string;role:UserRole;disabled:boolean};
export type Link={trainerId:string;athleteId:string;status:"pending"|"active"|"revoked"};
export function canSignIn(profile:{email?:string|null;email_verified?:boolean;sub?:string|null}, allowed:Set<string>, existing?:{googleSub:string|null;disabled:boolean}){if(!profile.email||profile.email_verified!==true||!allowed.has(profile.email.toLowerCase())&& !existing||existing?.disabled)return false; return !existing?.googleSub||existing.googleSub===profile.sub;}
export function canAccessAthlete(actor:Actor,athleteId:string,links:Link[]){return !actor.disabled&&(actor.role==="admin"||actor.id===athleteId||(actor.role==="trainer"&&links.some(l=>l.trainerId===actor.id&&l.athleteId===athleteId&&l.status==="active")));}
export function canMutateAthleteData(actor:Actor,athleteId:string){return !actor.disabled&&actor.id===athleteId;}
export function canManageExercise(actor:Actor,createdBy:string){return !actor.disabled&&(actor.role==="admin"||actor.role==="trainer"&&actor.id===createdBy);}
export function canManageRoutine(actor:Actor,routine:{athleteId:string;createdBy:string},links:Link[]){return !actor.disabled&&(actor.role==="admin"||actor.id===routine.athleteId&&actor.id===routine.createdBy||actor.role==="trainer"&&links.some(l=>l.trainerId===actor.id&&l.athleteId===routine.athleteId&&l.status==="active"));}
