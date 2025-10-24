// OpenAPI 3.0 spec kept separate from route files for cleanliness

const apiSpec = {
  openapi: '3.0.0',
  info: { title: 'MERN Auth + RBAC + Tasks API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:4000' }],
  tags: [
    { name: 'Auth', description: 'Authentication APIs' },
    { name: 'User', description: 'User self APIs' },
    { name: 'Notes', description: 'Notes CRUD APIs' }
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register', requestBody: {
          required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['name','email','password'],
            properties: { name:{type:'string'}, email:{type:'string'}, password:{type:'string'} }
          } } }
        }, responses: { 200: { description: 'Registered' } }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', requestBody: {
          required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['email','password'],
            properties: { email:{type:'string'}, password:{type:'string'} }
          } } }
        }, responses: { 200: { description: 'Logged in' } }
      }
    },
    '/api/v1/auth/logout': {
      post: { tags: ['Auth'], summary: 'Logout', responses: { 200: { description: 'Logged out' } } }
    },
    '/api/v1/auth/is-auth': {
      get: { tags: ['Auth'], summary: 'Check auth', responses: { 200: { description: 'OK' } } }
    },

    '/api/v1/user/data': {
      get: { tags: ['User'], summary: 'Get current user data', responses: { 200: { description: 'OK' } } }
    },

    // Google SSO
    '/api/v1/auth/google': {
      post: {
        tags: ['Auth'], summary: 'Google SSO login', requestBody: {
          required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['idToken'], properties: { idToken:{type:'string'} }
          } } }
        }, responses: { 200: { description: 'Logged in' } }
      }
    },

    '/api/v1/notes': {
      get: { tags: ['Notes'], summary: 'List notes', responses: { 200: { description: 'OK' } } },
      post: {
        tags: ['Notes'], summary: 'Create note', requestBody: {
          required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['content'], properties: { content:{type:'string'} }
          } } }
        }, responses: { 201: { description: 'Created' } }
      }
    },
    '/api/v1/notes/{id}': {
      parameters: [{ in:'path', name:'id', required:true, schema:{type:'string'} }],
      get: { tags: ['Notes'], summary: 'Get note', responses: { 200: { description: 'OK' } } },
      put: { tags: ['Notes'], summary: 'Update note', responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Notes'], summary: 'Delete note', responses: { 200: { description: 'Deleted' } } }
    },
    
  }
};

export default apiSpec;


