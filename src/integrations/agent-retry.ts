/** A failed inference never replaces the playing patch or silently changes model. */
export function inferenceRetry(error:unknown,failures:number){
 const message=error instanceof Error?error.message:String(error);
 const transient=/HTTP\s*(?:429|5\d\d)\b|unreachable|network|fetch failed|failed to fetch/i.test(message);
 return {message,seconds:transient?Math.min(60,5*2**Math.min(4,Math.max(0,failures))):0};
}
