export function getDefaultAvatar(nickname: string) {
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(nickname)}`;
}
