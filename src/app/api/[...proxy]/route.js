// import { NextResponse } from 'next/server';

// export async function GET(request, context) {
//   const params = await context.params; // await params first
//   const path = params.proxy ? params.proxy.join('/') : '';
//   const backendUrl = `http://192.168.1.79:3000/api/${path}`;
  
//   console.log('GET - Proxying to:', backendUrl);
  
//   try {
//     const response = await fetch(backendUrl, {
//       method: 'GET',
//       headers: {
//         cookie: request.headers.get('cookie') || '',
//       },
//     });

//     const data = await response.json();
//     const setCookie = response.headers.get('set-cookie');
    
//     return NextResponse.json(data, {
//       status: response.status,
//       headers: setCookie ? { 'Set-Cookie': setCookie } : {},
//     });
//   } catch (error) {
//     console.error('Proxy error:', error);
//     return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
//   }
// }

// export async function POST(request, context) {
//   const params = await context.params;
//   const path = params.proxy ? params.proxy.join('/') : '';
//   const backendUrl = `http://192.168.1.79:3000/api/${path}`;
  
//   console.log('POST - Proxying to:', backendUrl);
  
//   try {
//     const body = await request.json();
    
//     const response = await fetch(backendUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         cookie: request.headers.get('cookie') || '',
//       },
//       body: JSON.stringify(body),
//     });

//     const data = await response.json();
//     const setCookie = response.headers.get('set-cookie');
    
//     return NextResponse.json(data, {
//       status: response.status,
//       headers: setCookie ? { 'Set-Cookie': setCookie } : {},
//     });
//   } catch (error) {
//     console.error('Proxy error:', error);
//     return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
//   }
// }

// export async function PUT(request, context) {
//   const params = await context.params;
//   const path = params.proxy ? params.proxy.join('/') : '';
//   const backendUrl = `http://192.168.1.79:3000/api/${path}`;
  
//   console.log('PUT - Proxying to:', backendUrl);
  
//   try {
//     const body = await request.json();
    
//     const response = await fetch(backendUrl, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         cookie: request.headers.get('cookie') || '',
//       },
//       body: JSON.stringify(body),
//     });

//     const data = await response.json();
//     const setCookie = response.headers.get('set-cookie');
    
//     return NextResponse.json(data, {
//       status: response.status,
//       headers: setCookie ? { 'Set-Cookie': setCookie } : {},
//     });
//   } catch (error) {
//     console.error('Proxy error:', error);
//     return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
//   }
// }

// export async function DELETE(request, context) {
//   const params = await context.params;
//   const path = params.proxy ? params.proxy.join('/') : '';
//   const backendUrl = `http://192.168.1.79:3000/api/${path}`;
  
//   console.log('DELETE - Proxying to:', backendUrl);
  
//   try {
//     const response = await fetch(backendUrl, {
//       method: 'DELETE',
//       headers: {
//         cookie: request.headers.get('cookie') || '',
//       },
//     });

//     const data = await response.json();
//     const setCookie = response.headers.get('set-cookie');
    
//     return NextResponse.json(data, {
//       status: response.status,
//       headers: setCookie ? { 'Set-Cookie': setCookie } : {},
//     });
//   } catch (error) {
//     console.error('Proxy error:', error);
//     return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
//   }
// }

// export async function PATCH(request, context) {
//   const params = await context.params;
//   const path = params.proxy ? params.proxy.join('/') : '';
//   const backendUrl = `http://192.168.1.79:3000/api/${path}`;
  
//   console.log('PATCH - Proxying to:', backendUrl);
  
//   try {
//     const body = await request.json();
    
//     const response = await fetch(backendUrl, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         cookie: request.headers.get('cookie') || '',
//       },
//       body: JSON.stringify(body),
//     });

//     const data = await response.json();
//     const setCookie = response.headers.get('set-cookie');
    
//     return NextResponse.json(data, {
//       status: response.status,
//       headers: setCookie ? { 'Set-Cookie': setCookie } : {},
//     });
//   } catch (error) {
//     console.error('Proxy error:', error);
//     return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
//   }
// }



import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://posback.cloud9cafebutwal.com/api";

function buildBackendUrl(path) {
  return `${BACKEND_API_URL}/${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();

  return {
    success: response.ok,
    message: text || "No response body",
  };
}

// async function proxyRequest(request, context, method) {
//   try {
//     const params = await context.params;

//     const path = params?.proxy?.join("/") || "";

//     const backendUrl = buildBackendUrl(path);

//     console.log(`${method} Proxy -> ${backendUrl}`);

//     const headers = {
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       cookie: request.headers.get("cookie") || "",
//       authorization: request.headers.get("authorization") || "",
//     };

//     const options = {
//       method,
//       headers,
//       credentials: "include",
//       cache: "no-store",
//     };

//     // add body only if needed
//     if (!["GET", "DELETE"].includes(method)) {
//       try {
//         const body = await request.json();

//         options.body = JSON.stringify(body);
//       } catch {
//         console.log("No body");
//       }
//     }

//     const response = await fetch(backendUrl, options);

//     const data = await parseResponse(response);

//     const nextResponse = NextResponse.json(data, {
//       status: response.status,
//     });

//     const setCookie = response.headers.get("set-cookie");

//     if (setCookie) {
//       nextResponse.headers.set("set-cookie", setCookie);
//     }

//     return nextResponse;
//   } catch (error) {
//     console.error("Proxy Error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message,
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

async function proxyRequest(request, context, method) {
  try {

    const params = await context.params

    const path = params?.proxy?.join("/") || ""

    const backendUrl = buildBackendUrl(path)

    console.log(`${method} Proxy -> ${backendUrl}`)

    // detect content type
    const contentType = request.headers.get("content-type") || ""

    const headers = {
      Accept: "application/json",
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
    }

    const options = {
      method,
      headers,
      credentials: "include",
      cache: "no-store",
    }

    // BODY HANDLING
    if (!["GET", "DELETE"].includes(method)) {

      // FILE UPLOAD
      if (contentType.includes("multipart/form-data")) {

        console.log("Multipart upload detected")

        const formData = await request.formData()

        options.body = formData

        // IMPORTANT:
        // DO NOT SET CONTENT-TYPE
        // browser/fetch automatically sets boundary

      } else {

        // NORMAL JSON REQUEST
        headers["Content-Type"] = "application/json"

        try {

          const body = await request.json()

          options.body = JSON.stringify(body)

        } catch {

          console.log("No JSON body")

        }
      }
    }

    const response = await fetch(backendUrl, options)

    const data = await parseResponse(response)

    const nextResponse = NextResponse.json(data, {
      status: response.status,
    })

    const setCookie = response.headers.get("set-cookie")

    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie)
    }

    return nextResponse

  } catch (error) {

    console.error("Proxy Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    )
  }
}

export async function GET(request, context) {
  return proxyRequest(request, context, "GET");
}

export async function POST(request, context) {
  return proxyRequest(request, context, "POST");
}

export async function PUT(request, context) {
  return proxyRequest(request, context, "PUT");
}

export async function PATCH(request, context) {
  return proxyRequest(request, context, "PATCH");
}

export async function DELETE(request, context) {
  return proxyRequest(request, context, "DELETE");
}