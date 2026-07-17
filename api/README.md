# EduConnect PHP API + MySQL

Backend for Hostinger (or any PHP + MySQL host). Matches the React app models: students, college accounts, catalog, pending college listings, applications, Super Admin approve/reject.

## 1. Create database

1. Hostinger **hPanel → MySQL Databases** → create DB + user
2. phpMyAdmin → select DB → **Import** → upload `api/schema.sql`
3. Or CLI: `mysql -u USER -p DBNAME < api/schema.sql`

## 2. Config

Edit `api/config.php`:

```php
'host'     => 'localhost',
'dbname'   => 'uXXXX_educonnect',
'username' => 'uXXXX_admin',
'password' => 'YOUR_PASSWORD',
'cors_origin' => 'https://your-frontend-domain.com',
'admin_secret' => 'long-random-secret',
```

## 3. Upload

Upload the whole `api/` folder to:

`public_html/api/`

Site URL examples:

- `https://yoursite.com/api/health`
- `https://yoursite.com/api/students/register`

## 4. Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/students/register` | Student register (name, collegeName, branch, phone, email) |
| POST | `/students/login` | Student login |
| POST | `/college-accounts/register` | Campus account register |
| POST | `/college-accounts/login` | Campus login |
| GET | `/streams` | Streams list |
| GET | `/programs` | Programs list |
| GET | `/colleges?status=approved` | Public colleges |
| GET | `/colleges/{slug}` | College detail |
| POST | `/colleges` | Submit listing → **pending** for Super Admin |
| POST | `/colleges/{id}/contributions` | Student photo/edit request → **pending** |
| POST | `/applications` | Take Admission |
| GET | `/applications?email=` | Student applications |
| POST | `/admin/login` | `{ "username":"admin", "password":"…" }` → token |
| GET | `/admin/pending-colleges` | Header: `Authorization: Bearer TOKEN` |
| POST | `/admin/colleges/{id}/approve` | Approve (Bearer token) |
| POST | `/admin/colleges/{id}/reject` | Reject (Bearer token) |
| GET | `/admin/contributions?status=pending` | Student contributions (Bearer token) |
| POST | `/admin/contributions/{id}/update` | Edit pending contribution (Bearer token) |
| POST | `/admin/contributions/{id}/approve` | Approve & merge photos/edits (Bearer token) |
| POST | `/admin/contributions/{id}/reject` | Reject contribution (Bearer token) |
| GET | `/admin/students` | All registered students (Bearer token) |
| POST | `/admin/students/{id}/update` | Edit student profile (Bearer token) |
| POST | `/admin/students/{id}/delete` | Delete student (Bearer token) |

## 5. Example: student register

```bash
curl -X POST https://yoursite.com/api/students/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Riya\",\"collegeName\":\"ABC College\",\"branch\":\"CSE\",\"phone\":\"9876543210\",\"email\":\"riya@gmail.com\"}"
```

## 6. Example: submit college (pending)

```bash
curl -X POST https://yoursite.com/api/colleges \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"New Campus\",\"type\":\"private\",\"city\":\"Pune\",\"programIds\":[\"prog-btech\"],\"customPrograms\":[\"MBA\"],\"branches\":[\"CSE\"],\"feeRows\":[{\"programLabel\":\"B.Tech\",\"amount\":\"₹55,000 / year\"}],\"images\":[\"https://...\"],\"submittedBy\":\"student\"}"
```

## 7. Admin password

Default login username: `admin`. Password is set in the app/API login handler (auto-hashes on first successful login).

Generate your own hash:

```php
<?php echo password_hash('your-strong-password', PASSWORD_DEFAULT);
```

Update `admins` table in phpMyAdmin.

## Notes

- College listings from `POST /colleges` are always `pending` until Super Admin approves.
- Public `GET /colleges` defaults to `approved` only.
- React app still uses localStorage for now — wire `fetch()` to these URLs when you deploy.
