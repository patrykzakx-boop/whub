import type { Page } from "@playwright/test";

const mockUser = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "e2e@whub.pl",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
};

export function mockJwt() {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      role: "authenticated",
      sub: mockUser.id,
      email: mockUser.email,
    }),
    Buffer.from("e2e-signature").toString("base64url"),
  ].join(".");
}

export async function installCaptchaMock(page: Page) {
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.abort()
  );
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        window.setTimeout(() => options.callback("e2e-captcha-token"), 0);
        return "e2e-widget";
      },
      reset: () => undefined,
      remove: () => undefined,
    };
  });
}

export async function installSupabaseAuthFetchMock(
  page: Page,
  user: object,
  session: object
) {
  await page.addInitScript(
    ({ mockedUser, mockedSession }) => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : input.toString();

        if (requestUrl.includes("/auth/v1/")) {
          const responseBody = requestUrl.includes("/user")
            ? mockedUser
            : mockedSession;
          return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return originalFetch(input, init);
      };
    },
    { mockedUser: user, mockedSession: session }
  );
}

export async function installAuthenticatedSupabaseMock(page: Page) {
  const accessToken = mockJwt();
  const session = {
    access_token: accessToken,
    refresh_token: "e2e-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: mockUser,
  };

  await page.addInitScript(
    ({ storedSession }) => {
      window.localStorage.setItem(
        "sb-bhgezpszfqosxztedsbz-auth-token",
        JSON.stringify(storedSession)
      );
    },
    { storedSession: session }
  );
  await installSupabaseAuthFetchMock(page, mockUser, session);

  await page.route("**/auth/v1/**", async (route) => {
    const isUserRequest = new URL(route.request().url()).pathname.endsWith(
      "/user"
    );
    await route.fulfill({
      status: 200,
      json: isUserRequest ? mockUser : session,
    });
  });

  return { accessToken, session, user: mockUser };
}

export async function mockEmptySupabaseRest(page: Page) {
  await page.route("**/rest/v1/**", async (route) => {
    const method = route.request().method();
    await route.fulfill({
      status: method === "POST" ? 201 : 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Range": "0-0/0",
      },
      body: "[]",
    });
  });
}
