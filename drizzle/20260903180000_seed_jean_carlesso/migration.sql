INSERT INTO "users" ("name", "email", "password_hash", "email_verified_at", "role", "active")
VALUES (
  'Jean Carlesso',
  'jeancacarlesso@gmail.com',
  'scrypt:e48c45985d3c30e73b5429b820b54412:ddb0bc73ad9fa951b5cd109775ba1b32d56901e73014cd8f1f0147fb28d215f3c07d32d3755425e1a11180af2f0121a66b9077aa5d327d5fe815727292ee3357',
  now(),
  'student',
  true
)
ON CONFLICT ("email") DO NOTHING;
