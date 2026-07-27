import { expect, test } from "bun:test";

import { parsePythonImports } from "./python-imports.ts";

test("parsePythonImports ignores stdlib and maps known import names", () => {
  expect(
    parsePythonImports(`
import os
import numpy as np
from sklearn.linear_model import LinearRegression
from PIL import Image
import mapbox_earcut as earcut
`),
  ).toEqual(["mapbox-earcut", "numpy", "pillow", "scikit-learn"]);
});
