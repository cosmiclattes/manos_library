# Authentication Guide

## How Authentication Works

After the recent updates, the application now supports **both** cookie-based and header-based authentication.

## OAuth Flow with Cookies

### Step 1: Login with Google

Visit in your browser:
```
http://localhost:8000/auth/login/google
```

### Step 2: Automatic Cookie Setup and Redirect

After successful OAuth:
1. An HTTP-only cookie named `access_token` is automatically set
2. The cookie contains: `Bearer <your_jwt_token>`
3. Cookie expires in 30 minutes (configurable)
4. You'll be automatically redirected to the frontend dashboard at `http://localhost:3000/dashboard`

### Step 3: Access Protected Endpoints

Now you can visit protected endpoints directly in your browser:

```
http://localhost:8000/auth/me
http://localhost:8000/books/
http://localhost:8000/borrow/my-books
```

The cookie is **automatically sent** with each request - no manual token management needed!

## Two Ways to Authenticate

### Method 1: Cookie-Based (Browser)

**Best for:** Web browsers, testing in browser

After logging in via Google OAuth, the cookie is set automatically:
```
Cookie: access_token=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

All subsequent requests automatically include this cookie.

### Method 2: Header-Based (API Clients)

**Best for:** API clients, mobile apps, Postman, curl

Include the token in the Authorization header:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/auth/me
```

## Priority Order

The authentication system checks tokens in this order:
1. **Authorization header** (if present) - takes priority
2. **Cookie** (if header is not present) - fallback

This means:
- Browser users: Just login, cookies handle the rest
- API clients: Can still use Authorization header
- Both work simultaneously!

## Examples

### Using Browser (Cookie-Based)

```bash
# 1. Login (sets cookie automatically)
open http://localhost:8000/auth/login/google

# 2. After OAuth, directly access endpoints
open http://localhost:8000/auth/me
open http://localhost:8000/books/
```

### Using Swagger UI

1. Go to http://localhost:8000/docs
2. Click "Authorize" button
3. Login via Google: http://localhost:8000/auth/login/google (in another tab)
4. Copy the `access_token` from the response
5. In Swagger, enter: `Bearer <token>` or just `<token>`
6. Click "Authorize"
7. Now you can test all endpoints!

Alternatively, after logging in via Google, Swagger will also work automatically using cookies!

### Using curl (Header-Based)

```bash
# Get token from login response
TOKEN="your_access_token_here"

# Use in requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/auth/me

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/books/

curl -X POST http://localhost:8000/borrow/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"book_id": 1}'
```

### Using curl (Cookie-Based)

```bash
# Save cookies during login
curl -c cookies.txt http://localhost:8000/auth/login/google

# Use cookies in subsequent requests
curl -b cookies.txt http://localhost:8000/auth/me
curl -b cookies.txt http://localhost:8000/books/
```

## Logout

To clear the cookie and logout:

**Browser:**
```
POST http://localhost:8000/auth/logout
```

**curl:**
```bash
curl -X POST http://localhost:8000/auth/logout -b cookies.txt
```

## Cookie Details

The `access_token` cookie has these properties:

- **Name:** `access_token`
- **Value:** `Bearer <JWT_token>`
- **HttpOnly:** `true` (JavaScript can't access it - security)
- **SameSite:** `lax` (CSRF protection)
- **Secure:** `false` (set to `true` in production with HTTPS)
- **Max-Age:** 30 minutes (1800 seconds)
- **Path:** `/` (sent with all requests)

## Security Features

### HTTP-Only Cookie
- JavaScript cannot access the cookie
- Prevents XSS attacks from stealing tokens
- Cookie is only sent via HTTP requests

### SameSite Protection
- Cookie is not sent with cross-origin requests
- Protects against CSRF attacks

### Token Expiration
- Tokens expire after 30 minutes
- Users must re-authenticate after expiration

## Troubleshooting

### "Not authenticated" error after login

**Check:**
1. Is the cookie being set?
   - Open browser DevTools → Application → Cookies
   - Look for `access_token` cookie
2. Is the cookie domain correct?
   - Should be `localhost` or your domain
3. Try clearing cookies and login again

### Cookie not being sent

**Possible causes:**
1. Using HTTPS for app but cookie set as non-secure
   - Solution: Set `secure=True` in production
2. Cross-origin requests
   - Solution: Ensure requests come from same origin
3. Cookie expired
   - Solution: Login again

### Works in browser but not in Postman/curl

**This is expected!**
- Browsers automatically handle cookies
- API clients need to manually save/send cookies
- Use `-c` and `-b` flags with curl
- Or use Authorization header instead

## Production Configuration

For production (HTTPS), update `app/api/auth.py`:

```python
response.set_cookie(
    key="access_token",
    value=f"Bearer {access_token}",
    httponly=True,
    max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    samesite="strict",  # More restrictive in production
    secure=True,        # Require HTTPS
    domain="yourdomain.com"  # Your actual domain
)
```

## Summary

✅ **Cookies are now set automatically** after Google OAuth
✅ **Browser access works without manual token management**
✅ **API clients can still use Authorization headers**
✅ **Both methods work simultaneously**
✅ **Logout endpoint clears the cookie**
✅ **HTTP-only and SameSite protection enabled**

You can now use the application directly in your browser after logging in once! 🎉
