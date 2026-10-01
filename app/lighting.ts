// A small HDR studio environment: neutral fill plus a movable colored softbox.
export function createLightingEnvironment(lightX = 38, lightY = 22, color = "#ffffff") {
  const width = 128, height = 64;
  const header = new TextEncoder().encode(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`);
  const bytes = new Uint8Array(header.length + width * height * 4);
  bytes.set(header);
  const tint = [1, 3, 5].map(start => {
    const s = parseInt(color.slice(start, start + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const yaw = (lightX / 100) * Math.PI * 2;
  const elevation = (0.5 - lightY / 100) * Math.PI * 0.8;
  const direction = [Math.cos(elevation) * Math.sin(yaw), Math.sin(elevation), Math.cos(elevation) * Math.cos(yaw)];
  for (let y = 0; y < height; y++) {
    const phi = Math.PI * (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const theta = Math.PI * 2 * (x + 0.5) / width;
      const normal = [Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta)];
      const dot = normal.reduce((sum, n, i) => sum + n * direction[i], 0);
      const key = 8 * Math.exp((dot - 1) * 18);
      const fill = 0.3 + 0.25 * Math.max(0, normal[1]);
      const rgb = tint.map(channel => fill + key * channel);
      const exponent = Math.floor(Math.log2(Math.max(...rgb))) + 1;
      const scale = 256 / Math.pow(2, exponent);
      const offset = header.length + (y * width + x) * 4;
      rgb.forEach((channel, i) => bytes[offset + i] = Math.min(255, Math.floor(channel * scale)));
      bytes[offset + 3] = exponent + 128;
    }
  }
  return new Blob([bytes], { type: "application/octet-stream" });
}
