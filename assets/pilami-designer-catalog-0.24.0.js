/* Hydra function names/defaults from the bundled hydra-synth engine. */
(function(g){g.PilamiDesignerCatalog={
  "noise": {
    "group": "Sources",
    "kind": "source",
    "params": [
      {
        "name": "scale",
        "value": 10
      },
      {
        "name": "offset",
        "value": 0.1
      }
    ]
  },
  "voronoi": {
    "group": "Sources",
    "kind": "source",
    "params": [
      {
        "name": "scale",
        "value": 5
      },
      {
        "name": "speed",
        "value": 0.3
      },
      {
        "name": "blending",
        "value": 0.3
      }
    ]
  },
  "osc": {
    "group": "Sources",
    "kind": "source",
    "params": [
      {
        "name": "frequency",
        "value": 60
      },
      {
        "name": "sync",
        "value": 0.1
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "shape": {
    "group": "Sources",
    "kind": "source",
    "params": [
      {
        "name": "sides",
        "value": 3
      },
      {
        "name": "radius",
        "value": 0.3
      },
      {
        "name": "smoothing",
        "value": 0.01
      }
    ]
  },
  "gradient": {
    "group": "Sources",
    "kind": "source",
    "params": [
      {
        "name": "speed",
        "value": 0
      }
    ]
  },
  "solid": {
    "group": "Sources",
    "kind": "source",
    "params": [
      {
        "name": "r",
        "value": 0
      },
      {
        "name": "g",
        "value": 0
      },
      {
        "name": "b",
        "value": 0
      },
      {
        "name": "a",
        "value": 1
      }
    ]
  },
  "rotate": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "angle",
        "value": 10
      },
      {
        "name": "speed",
        "value": 0
      }
    ]
  },
  "scale": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "amount",
        "value": 1.5
      },
      {
        "name": "xMult",
        "value": 1
      },
      {
        "name": "yMult",
        "value": 1
      },
      {
        "name": "offsetX",
        "value": 0.5
      },
      {
        "name": "offsetY",
        "value": 0.5
      }
    ]
  },
  "pixelate": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "pixelX",
        "value": 20
      },
      {
        "name": "pixelY",
        "value": 20
      }
    ]
  },
  "posterize": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "bins",
        "value": 3
      },
      {
        "name": "gamma",
        "value": 0.6
      }
    ]
  },
  "shift": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "r",
        "value": 0.5
      },
      {
        "name": "g",
        "value": 0
      },
      {
        "name": "b",
        "value": 0
      },
      {
        "name": "a",
        "value": 0
      }
    ]
  },
  "repeat": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "repeatX",
        "value": 3
      },
      {
        "name": "repeatY",
        "value": 3
      },
      {
        "name": "offsetX",
        "value": 0
      },
      {
        "name": "offsetY",
        "value": 0
      }
    ]
  },
  "modulateRepeat": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "repeatX",
        "value": 3
      },
      {
        "name": "repeatY",
        "value": 3
      },
      {
        "name": "offsetX",
        "value": 0.5
      },
      {
        "name": "offsetY",
        "value": 0.5
      }
    ]
  },
  "repeatX": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "reps",
        "value": 3
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "modulateRepeatX": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "reps",
        "value": 3
      },
      {
        "name": "offset",
        "value": 0.5
      }
    ]
  },
  "repeatY": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "reps",
        "value": 3
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "modulateRepeatY": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "reps",
        "value": 3
      },
      {
        "name": "offset",
        "value": 0.5
      }
    ]
  },
  "kaleid": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "nSides",
        "value": 4
      }
    ]
  },
  "modulateKaleid": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "nSides",
        "value": 4
      }
    ]
  },
  "scroll": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "scrollX",
        "value": 0.5
      },
      {
        "name": "scrollY",
        "value": 0.5
      },
      {
        "name": "speedX",
        "value": 0
      },
      {
        "name": "speedY",
        "value": 0
      }
    ]
  },
  "scrollX": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "scrollX",
        "value": 0.5
      },
      {
        "name": "speed",
        "value": 0
      }
    ]
  },
  "modulateScrollX": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "scrollX",
        "value": 0.5
      },
      {
        "name": "speed",
        "value": 0
      }
    ]
  },
  "scrollY": {
    "group": "Transformations",
    "kind": "effect",
    "params": [
      {
        "name": "scrollY",
        "value": 0.5
      },
      {
        "name": "speed",
        "value": 0
      }
    ]
  },
  "modulateScrollY": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "scrollY",
        "value": 0.5
      },
      {
        "name": "speed",
        "value": 0
      }
    ]
  },
  "add": {
    "group": "Mix",
    "kind": "mix",
    "params": [
      {
        "name": "amount",
        "value": 1
      }
    ]
  },
  "sub": {
    "group": "Mix",
    "kind": "mix",
    "params": [
      {
        "name": "amount",
        "value": 1
      }
    ]
  },
  "layer": {
    "group": "Mix",
    "kind": "mix",
    "params": []
  },
  "blend": {
    "group": "Mix",
    "kind": "mix",
    "params": [
      {
        "name": "amount",
        "value": 0.5
      }
    ]
  },
  "mult": {
    "group": "Mix",
    "kind": "mix",
    "params": [
      {
        "name": "amount",
        "value": 1
      }
    ]
  },
  "diff": {
    "group": "Mix",
    "kind": "mix",
    "params": []
  },
  "modulate": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "amount",
        "value": 0.1
      }
    ]
  },
  "modulateScale": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "multiple",
        "value": 1
      },
      {
        "name": "offset",
        "value": 1
      }
    ]
  },
  "modulatePixelate": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "multiple",
        "value": 10
      },
      {
        "name": "offset",
        "value": 3
      }
    ]
  },
  "modulateRotate": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "multiple",
        "value": 1
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "modulateHue": {
    "group": "Modulations",
    "kind": "mix",
    "params": [
      {
        "name": "amount",
        "value": 1
      }
    ]
  },
  "invert": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "amount",
        "value": 1
      }
    ]
  },
  "contrast": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "amount",
        "value": 1.6
      }
    ]
  },
  "brightness": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "amount",
        "value": 0.4
      }
    ]
  },
  "mask": {
    "group": "Mix",
    "kind": "mix",
    "params": []
  },
  "luma": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "threshold",
        "value": 0.5
      },
      {
        "name": "tolerance",
        "value": 0.1
      }
    ]
  },
  "thresh": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "threshold",
        "value": 0.5
      },
      {
        "name": "tolerance",
        "value": 0.04
      }
    ]
  },
  "color": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "r",
        "value": 1
      },
      {
        "name": "g",
        "value": 1
      },
      {
        "name": "b",
        "value": 1
      },
      {
        "name": "a",
        "value": 1
      }
    ]
  },
  "saturate": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "amount",
        "value": 2
      }
    ]
  },
  "hue": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "hue",
        "value": 0.4
      }
    ]
  },
  "colorama": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "amount",
        "value": 0.005
      }
    ]
  },
  "prev": {
    "group": "Sources",
    "kind": "source",
    "params": []
  },
  "r": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "scale",
        "value": 1
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "g": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "scale",
        "value": 1
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "b": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "scale",
        "value": 1
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  },
  "a": {
    "group": "Couleur",
    "kind": "effect",
    "params": [
      {
        "name": "scale",
        "value": 1
      },
      {
        "name": "offset",
        "value": 0
      }
    ]
  }
};})(typeof window!=="undefined"?window:globalThis);
