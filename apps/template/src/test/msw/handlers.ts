import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://localhost:44334'

export const handlers = [
  // GET /api/abp/application-configuration
  http.get(`${BASE_URL}/api/abp/application-configuration`, () =>
    HttpResponse.json({
      currentUser: {
        id: '1',
        userName: 'admin',
        isAuthenticated: true,
        name: 'Admin',
      },
      auth: {
        grantedPolicies: {
          'AbpIdentity.Users': true,
          'AbpIdentity.Users.Create': true,
          'AbpIdentity.Users.Update': true,
          'AbpIdentity.Users.Delete': true,
        },
      },
      localization: {
        defaultResourceName: 'App',
        currentCulture: { name: 'tr', cultureName: 'tr', displayName: 'Türkçe', twoLetterIsoLanguageName: 'tr' },
        languages: [
          { cultureName: 'tr', uiCultureName: 'tr', displayName: 'Türkçe', twoLetterIsoLanguageName: 'tr' },
          { cultureName: 'en', uiCultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
        ],
        values: {},
      },
    }),
  ),

  // GET /api/identity/users (with optional query params)
  http.get(`${BASE_URL}/api/identity/users`, () =>
    HttpResponse.json({
      items: [
        {
          id: 'u1',
          userName: 'admin',
          email: 'admin@abp.io',
          name: 'Admin',
          surname: '',
          isActive: true,
          phoneNumber: null,
          concurrencyStamp: 'stamp1',
        },
      ],
      totalCount: 1,
    }),
  ),

  // POST /api/identity/users — echo the created user
  http.post(`${BASE_URL}/api/identity/users`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'u-new',
        userName: body.userName ?? 'newuser',
        email: body.email ?? '',
        name: body.name ?? '',
        surname: body.surname ?? '',
        isActive: true,
        phoneNumber: null,
        concurrencyStamp: 'stamp-new',
      },
      { status: 201 },
    )
  }),

  // GET /api/identity/users/assignable-roles
  http.get(`${BASE_URL}/api/identity/users/assignable-roles`, () =>
    HttpResponse.json({ items: [] }),
  ),

  // GET /api/account/my-profile
  http.get(`${BASE_URL}/api/account/my-profile`, () =>
    HttpResponse.json({
      userName: 'admin',
      email: 'admin@abp.io',
      name: 'Admin',
      surname: 'User',
      phoneNumber: null,
      isExternal: false,
      hasPassword: true,
      concurrencyStamp: 'stamp1',
    }),
  ),
]
