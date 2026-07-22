export const PLAYER_RUN_FRAME_COUNT = 8;

const TAU = Math.PI * 2;

export function normalizeCycleDistance(distance, strideDistance) {
    if (!Number.isFinite(distance) || !Number.isFinite(strideDistance) || strideDistance <= 0) {
        return 0;
    }

    return ((distance % strideDistance) + strideDistance) % strideDistance;
}

export function advanceRunCycleDistance(currentDistance, traveledDistance, strideDistance) {
    const safeTravel = Number.isFinite(traveledDistance) ? Math.max(0, traveledDistance) : 0;
    return normalizeCycleDistance(currentDistance + safeTravel, strideDistance);
}

export function getRunCyclePhase(distance, strideDistance) {
    if (!Number.isFinite(strideDistance) || strideDistance <= 0) return 0;
    return normalizeCycleDistance(distance, strideDistance) / strideDistance;
}

export function getRunCycleFrame(phase, frameCount = PLAYER_RUN_FRAME_COUNT) {
    const safeFrameCount = Math.max(1, Math.floor(frameCount));
    const normalizedPhase = ((phase % 1) + 1) % 1;
    return Math.min(safeFrameCount - 1, Math.floor(normalizedPhase * safeFrameCount));
}

export function getRunBobOffset(phase, amount = 1.8) {
    return Math.abs(Math.sin(phase * TAU)) * amount;
}

export function crossedFootfall(previousPhase, currentPhase) {
    const wrapped = currentPhase < previousPhase;
    const crossedMidpoint = previousPhase < 0.5 && currentPhase >= 0.5;
    return wrapped || crossedMidpoint;
}

export function smoothFacingScale(currentScale, facingRight, deltaTimeFactor) {
    const target = facingRight ? 1 : -1;
    const current = Number.isFinite(currentScale) ? currentScale : target;
    const delta = Number.isFinite(deltaTimeFactor) ? Math.max(0, deltaTimeFactor) : 0;
    const smoothing = 1 - Math.pow(0.78, delta);
    const next = current + (target - current) * smoothing;

    return Math.abs(target - next) < 0.002 ? target : next;
}
