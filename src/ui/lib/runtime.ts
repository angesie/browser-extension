export function sendMessage<TReq, TRes>(msg: TReq): Promise<TRes> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else resolve(res as TRes);
    });
  });
}
