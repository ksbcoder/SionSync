-- Registrar consentimiento de tratamiento de datos en perfiles
ALTER TABLE profiles ADD COLUMN data_consent_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN data_consent_version TEXT;

-- Los usuarios existentes NO tienen consentimiento registrado,
-- por lo que la app les mostrará la política obligatoriamente
-- antes de permitirles continuar.
