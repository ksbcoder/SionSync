ALTER TABLE profiles
  ADD CONSTRAINT chk_display_name_length CHECK (char_length(display_name) <= 50);
