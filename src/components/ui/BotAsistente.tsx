import { BotAvatar, type BotAvatarState } from 'bot-avatars';

interface BotAsistenteProps {
  /** 'default' = tranquilo (mira a los lados); 'working' = trabajando (salta y se ríe); 'sleeping' = durmiendo. */
  state: BotAvatarState;
  size?: number;
}

/**
 * La cara del asistente de IA: un fantasma indigo con gafas de sol y audífonos.
 * Al cambiar de estado, la librería pasa de una animación a otra con una
 * transición suave. Es decorativo (oculto para lectores de pantalla) porque
 * siempre va junto a un texto que dice qué está pasando.
 *
 * Se fija en tema claro: en `auto` seguiría el modo oscuro del sistema, y la
 * app no tiene modo oscuro.
 */
export function BotAsistente({ state, size = 64 }: BotAsistenteProps) {
  return (
    <BotAvatar
      type="ghost"
      shading="smooth"
      color="#4f46e5" // brand-600
      face="mouth"
      glasses="shades"
      headphones
      theme="light"
      state={state}
      size={size}
      aria-hidden="true"
    />
  );
}
