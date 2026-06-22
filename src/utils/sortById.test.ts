import { describe, expect, it } from "vitest";
import { sortById } from "./sortById";

describe("sortById", () => {
  it("sorts items ascending by id", () => {
    const items = [{ id: 3 }, { id: 1 }, { id: 2 }];
    expect(sortById(items).map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("does not mutate the original array", () => {
    const items = [{ id: 2 }, { id: 1 }];
    sortById(items);
    expect(items.map((item) => item.id)).toEqual([2, 1]);
  });
});
