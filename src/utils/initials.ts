/** Chữ cái đầu của tên gọi (từ cuối), vd "Quốc Thịnh" -> "T", "Giai Nhân" -> "N". */
export function givenNameInitial(name: string, fallback: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const last = words[words.length - 1]
  return last ? Array.from(last)[0].toUpperCase() : fallback
}

export function coupleMonogram(groomName: string, brideName: string): string {
  return `${givenNameInitial(groomName, 'T')} ♡ ${givenNameInitial(brideName, 'N')}`
}
