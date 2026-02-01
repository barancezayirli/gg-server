import { CellType } from '@gg-server/types';
import type { DungeonMap } from '@gg-server/types';

export function generateDungeonMap(width = 20, height = 20): DungeonMap {
  const cells: CellType[][] = [];

  for (let y = 0; y < height; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(CellType.Wall);
      } else if (x === 1 && y === 1) {
        row.push(CellType.Entrance);
      } else if (x === width - 2 && y === height - 2) {
        row.push(CellType.TreasureRoom);
      } else if (
        Math.random() < 0.15 &&
        !(x <= 2 && y <= 2) // keep entrance area clear
      ) {
        row.push(CellType.Wall);
      } else {
        row.push(CellType.Floor);
      }
    }
    cells.push(row);
  }

  return { width, height, cells };
}

export function isWalkable(map: DungeonMap, x: number, y: number): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;
  return map.cells[y][x] !== CellType.Wall;
}
