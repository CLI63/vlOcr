-- Non-destructive migration for P0/P1 security hardening.
-- Existing img_history rows keep user_id = NULL and are visible only to admins.

ALTER TABLE users
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';

UPDATE users
  SET role = 'admin'
  WHERE username = 'admin';

ALTER TABLE img_history
  ADD COLUMN user_id INT(11) NULL;

CREATE INDEX idx_img_history_user_id ON img_history(user_id);
