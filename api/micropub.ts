import { NowRequest, NowResponse } from '@vercel/node'

export default (req: NowRequest, res: NowResponse) => {
  if (req.method === "GET) {
    return get(req, res);
  } else if (req.method === "POST") {
    return post(req, res);
  }
}

function post(req: NowRequest, res: NowResponse) {
}

function get(req: NowRequest, res: NowResponse) {
 if (req.query.q === "config") {
    res.send({
      "media-endpoint": `https://${req.headers.host}/micropub`
      // syndicate-to
    });
  } else {
		res.header("Link", '<https://${req.headers.host}/api/micropub>; rel="micropub"')
		)
    res.send({})
  }
}
