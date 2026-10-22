export class ApiError extends Error {constructor(public status:number,public code:string,message:string){super(message);}}
export function unavailable(message:string):never {throw new ApiError(503,'CAPABILITY_UNAVAILABLE',message);}
