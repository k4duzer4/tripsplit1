import handler from '../server/app.js';

export default function routeApiRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const route = url.searchParams.get('__route');

  if (route) {
    url.searchParams.delete('__route');
    request.url = `/api/${route}${url.search}`;
  }

  return handler(request, response);
}
