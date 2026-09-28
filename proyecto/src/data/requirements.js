// Requisitos de Windows publicados por las fuentes enlazadas. No son estimaciones.
const steam = (id, os, cpu, ram, gpu, storage, directx, notes = '') => ({ os, cpu, ram, gpu, storage, directx, notes, source: `https://store.steampowered.com/app/${id}/` })
const requirements = {
  'zenless zone zero': { os: 'Windows 10 o posterior', cpu: 'Intel Core i5 de 7.ª generación', ram: '8 GB', gpu: 'NVIDIA GeForce GTX 970', storage: 'No indicado en la ficha; consultar el lanzador', directx: 'No indicado en la ficha', source: 'https://store.epicgames.com/p/zenless-zone-zero-c7c151', sourceName: 'Epic Games' },
  'elden ring': steam(1245620, 'Windows 10 de 64 bits', 'Intel Core i5-8400 / AMD Ryzen 3 3300X', '12 GB', 'GeForce GTX 1060 (3 GB) / Radeon RX 580 (4 GB)', '60 GB', '12'),
  'devil may cry 5': steam(601150, 'Windows 10 de 64 bits', 'Intel Core i5-4460 / AMD FX-6300', '8 GB', 'GeForce GTX 760 / Radeon R7 260X (2 GB)', '35 GB', '11', 'Requiere conexión a Internet para la activación.'),
  'starfield': steam(1716740, 'Windows 10 versión 21H1', 'AMD Ryzen 5 2600X / Intel Core i7-6800K', '16 GB', 'Radeon RX 5700 / GeForce GTX 1070 Ti', '125 GB en SSD', '12'),
  'god of war ragnarok': steam(2322010, 'Windows 10 20H1 de 64 bits', 'Intel Core i5-4670K / AMD Ryzen 3 1200', '8 GB', 'GTX 1060 (6 GB) / RX 5500 XT (8 GB) / Intel Arc A750', '190 GB en SSD', '12'),
  'cyberpunk 2077': steam(1091500, 'Windows 10 de 64 bits', 'Intel Core i7-6700 / AMD Ryzen 5 1600', '12 GB', 'GTX 1060 (6 GB) / RX 580 (8 GB) / Intel Arc A380', '70 GB en SSD', '12'),
  'resident evil requiem': steam(3764200, 'Windows 11 de 64 bits', 'Intel Core i5-8500 / AMD Ryzen 5 3500', '16 GB', 'GTX 1660 (6 GB) / RX 5500 XT (8 GB)', 'SSD obligatorio; capacidad no indicada', '12'),
  'celeste': steam(504230, 'Windows 7 o posterior (Steam requiere Windows 10 o posterior)', 'Intel Core i3 M380', '2 GB', 'Intel HD 4000', '1200 MB', '10'),
  'sekiro shadows die twice': steam(814380, 'Windows 7 / 8 / 10 de 64 bits (Steam requiere Windows 10 o posterior)', 'Intel Core i3-2100 / AMD FX-6300', '4 GB', 'GeForce GTX 760 / Radeon HD 7950', '25 GB', '11'),
}
export function getRequirements(game) {
  const title = (game.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  return requirements[title] || null
}
