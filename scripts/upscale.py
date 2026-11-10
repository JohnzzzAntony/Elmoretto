"""Real-ESRGAN (realesr-general-x4v3) on the CPU: a 4x upscaler that restores edges and removes compression noise.

Weights: models/realesrgan/realesr-general-x4v3.pth, from
https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth
"""

from pathlib import Path

import torch
import torch.nn.functional as F
from torch import nn

WEIGHTS = Path(__file__).resolve().parents[1] / "models" / "realesrgan" / "realesr-general-x4v3.pth"
SCALE = 4


class Compact(nn.Module):
    """SRVGGNetCompact: 64 features, 32 convolutions, pixel-shuffle output added to a nearest upsample."""

    def __init__(self, features=64, convs=32):
        super().__init__()
        layers = [nn.Conv2d(3, features, 3, 1, 1), nn.PReLU(features)]
        for _ in range(convs):
            layers += [nn.Conv2d(features, features, 3, 1, 1), nn.PReLU(features)]
        layers.append(nn.Conv2d(features, 3 * SCALE * SCALE, 3, 1, 1))
        self.body = nn.ModuleList(layers)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return F.pixel_shuffle(out, SCALE) + F.interpolate(x, scale_factor=SCALE, mode="nearest")


def load():
    state = torch.load(WEIGHTS, map_location="cpu", weights_only=True)
    model = Compact()
    model.load_state_dict(state.get("params_ema", state.get("params", state)))
    return model.eval()


@torch.inference_mode()
def upscale(model, image):
    """image: float tensor [1, 3, H, W] in 0..1. Returns [1, 3, 4H, 4W] in 0..1."""
    return model(image).clamp(0, 1)
