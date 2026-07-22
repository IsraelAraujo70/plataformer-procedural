const INK = '#101643';
const DEEP_INK = '#070b25';
const EYE_WHITE = '#fff7d6';

function fillAndStroke(ctx, fill, strokeWidth = 3) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawShadow(ctx, x, y, width, alpha = 0.28) {
    ctx.fillStyle = `rgba(5, 8, 30, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, width, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawEye(ctx, x, y, rx, ry, pupilX = 0, pupilY = 1, blinking = false) {
    if (blinking) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - rx, y);
        ctx.quadraticCurveTo(x, y + 2, x + rx, y);
        ctx.stroke();
        return;
    }

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x, y, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = EYE_WHITE;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DEEP_INK;
    ctx.beginPath();
    ctx.arc(x + pupilX, y + pupilY, Math.max(2, rx * 0.42), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + pupilX - 1, y + pupilY - 1.5, Math.max(0.9, rx * 0.16), 0, Math.PI * 2);
    ctx.fill();
}

function drawWalker(ctx, enemy, x, y, w, h) {
    const direction = enemy.vx >= 0 ? 1 : -1;
    drawShadow(ctx, x + w / 2, y + h + 1, w * 0.38);

    // Patas curtas deixam a patrulha legível sem aumentar a hitbox.
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.28, y + h * 0.87, w * 0.18, h * 0.14, -0.12, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.72, y + h * 0.87, w * 0.18, h * 0.14, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9f2f27';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.28, y + h * 0.85, w * 0.13, h * 0.09, -0.12, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.72, y + h * 0.85, w * 0.13, h * 0.09, 0.12, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createRadialGradient(x + w * 0.34, y + h * 0.22, 1, x + w * 0.52, y + h * 0.48, w * 0.52);
    body.addColorStop(0, '#ffd23b');
    body.addColorStop(0.34, '#ff8a22');
    body.addColorStop(0.72, '#e44b20');
    body.addColorStop(1, '#8f2630');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + h * 0.58);
    ctx.quadraticCurveTo(x + w * 0.08, y + h * 0.18, x + w * 0.38, y + h * 0.1);
    ctx.quadraticCurveTo(x + w * 0.69, y - h * 0.01, x + w * 0.88, y + h * 0.34);
    ctx.quadraticCurveTo(x + w * 1.02, y + h * 0.73, x + w * 0.7, y + h * 0.86);
    ctx.quadraticCurveTo(x + w * 0.31, y + h * 0.97, x + w * 0.12, y + h * 0.58);
    ctx.closePath();
    fillAndStroke(ctx, body, 3.5);

    // Crateras fixas: textura de meteoro, sem ruído por frame.
    ctx.fillStyle = 'rgba(122, 32, 49, 0.52)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.72, y + h * 0.22, w * 0.1, h * 0.07, 0.4, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.19, y + h * 0.55, w * 0.08, h * 0.1, -0.3, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.72, y + h * 0.7, w * 0.07, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    const look = direction * 1.1;
    drawEye(ctx, x + w * 0.39, y + h * 0.42, w * 0.12, h * 0.14, look, 1, enemy.isBlinking);
    drawEye(ctx, x + w * 0.64, y + h * 0.41, w * 0.12, h * 0.14, look, 1, enemy.isBlinking);

    ctx.fillStyle = DEEP_INK;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.36, y + h * 0.66);
    ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.82, x + w * 0.69, y + h * 0.64);
    ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.71, x + w * 0.36, y + h * 0.66);
    ctx.fill();
    ctx.fillStyle = EYE_WHITE;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.43, y + h * 0.69);
    ctx.lineTo(x + w * 0.49, y + h * 0.77);
    ctx.lineTo(x + w * 0.54, y + h * 0.7);
    ctx.fill();
}

function drawFlyer(ctx, enemy, x, y, w, h) {
    const flap = 0.5 + Math.sin(Date.now() / 115 + enemy.waveOffset) * 0.5;
    const wingLift = h * (0.12 + flap * 0.22);

    ctx.save();
    ctx.globalAlpha = 0.96;
    const wingGradient = ctx.createLinearGradient(x - w * 0.25, y, x + w * 1.25, y + h);
    wingGradient.addColorStop(0, '#7d4cff');
    wingGradient.addColorStop(0.5, '#e04cff');
    wingGradient.addColorStop(1, '#25d9ef');

    ctx.beginPath();
    ctx.moveTo(x + w * 0.31, y + h * 0.36);
    ctx.quadraticCurveTo(x - w * 0.2, y - wingLift, x - w * 0.28, y + h * 0.32);
    ctx.quadraticCurveTo(x - w * 0.08, y + h * 0.55, x + w * 0.38, y + h * 0.64);
    ctx.closePath();
    fillAndStroke(ctx, wingGradient, 3.5);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.69, y + h * 0.36);
    ctx.quadraticCurveTo(x + w * 1.2, y - wingLift, x + w * 1.28, y + h * 0.32);
    ctx.quadraticCurveTo(x + w * 1.08, y + h * 0.55, x + w * 0.62, y + h * 0.64);
    ctx.closePath();
    fillAndStroke(ctx, wingGradient, 3.5);
    ctx.restore();

    ctx.strokeStyle = 'rgba(191, 251, 255, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.24, y + h * 0.38);
    ctx.quadraticCurveTo(x - w * 0.03, y + h * 0.14 - wingLift * 0.45, x - w * 0.14, y + h * 0.31);
    ctx.moveTo(x + w * 0.76, y + h * 0.38);
    ctx.quadraticCurveTo(x + w * 1.03, y + h * 0.14 - wingLift * 0.45, x + w * 1.14, y + h * 0.31);
    ctx.stroke();

    const body = ctx.createRadialGradient(x + w * 0.39, y + h * 0.28, 1, x + w * 0.52, y + h * 0.5, w * 0.42);
    body.addColorStop(0, '#f8adff');
    body.addColorStop(0.35, '#b83eea');
    body.addColorStop(1, '#4a238f');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.08);
    ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.16, x + w * 0.78, y + h * 0.58);
    ctx.quadraticCurveTo(x + w * 0.73, y + h * 0.9, x + w * 0.5, y + h * 0.96);
    ctx.quadraticCurveTo(x + w * 0.27, y + h * 0.9, x + w * 0.22, y + h * 0.58);
    ctx.quadraticCurveTo(x + w * 0.18, y + h * 0.16, x + w * 0.5, y + h * 0.08);
    ctx.closePath();
    fillAndStroke(ctx, body, 3.5);

    // Um grande olho central dá uma leitura instantânea de criatura voadora cósmica.
    drawEye(ctx, x + w * 0.5, y + h * 0.45, w * 0.19, h * 0.2, enemy.vx >= 0 ? 1.5 : -1.5, 0.5, enemy.isBlinking);
    ctx.fillStyle = '#35e8ff';
    ctx.beginPath();
    ctx.arc(x + w * 0.5 + (enemy.vx >= 0 ? 1.5 : -1.5), y + h * 0.46, w * 0.055, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#efb6ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.42, y + h * 0.12);
    ctx.quadraticCurveTo(x + w * 0.33, y - h * 0.08, x + w * 0.22, y + h * 0.02);
    ctx.moveTo(x + w * 0.58, y + h * 0.12);
    ctx.quadraticCurveTo(x + w * 0.67, y - h * 0.08, x + w * 0.78, y + h * 0.02);
    ctx.stroke();
}

function drawJumper(ctx, enemy, x, y, w, h) {
    const charge = enemy.grounded ? Math.min(1, enemy.jumpTimer / enemy.jumpInterval) : 0;
    const squash = enemy.grounded ? 1 - charge * 0.18 : 1.1;
    const bodyH = h * 0.75 * squash;
    const bodyY = y + h - bodyH - h * 0.08;
    drawShadow(ctx, x + w / 2, y + h + 1, enemy.grounded ? w * 0.42 : w * 0.27);

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.24, y + h * 0.89, w * 0.2, h * 0.11, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.76, y + h * 0.89, w * 0.2, h * 0.11, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8ff38';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.24, y + h * 0.87, w * 0.14, h * 0.065, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.76, y + h * 0.87, w * 0.14, h * 0.065, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createRadialGradient(x + w * 0.36, bodyY + bodyH * 0.24, 1, x + w * 0.52, bodyY + bodyH * 0.55, w * 0.48);
    body.addColorStop(0, '#eaff57');
    body.addColorStop(0.38, '#69df56');
    body.addColorStop(0.73, '#15b785');
    body.addColorStop(1, '#087565');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.09, bodyY + bodyH * 0.55);
    ctx.quadraticCurveTo(x + w * 0.14, bodyY + bodyH * 0.04, x + w * 0.5, bodyY);
    ctx.quadraticCurveTo(x + w * 0.86, bodyY + bodyH * 0.04, x + w * 0.91, bodyY + bodyH * 0.55);
    ctx.quadraticCurveTo(x + w * 0.82, bodyY + bodyH, x + w * 0.5, bodyY + bodyH);
    ctx.quadraticCurveTo(x + w * 0.18, bodyY + bodyH, x + w * 0.09, bodyY + bodyH * 0.55);
    ctx.closePath();
    fillAndStroke(ctx, body, 3.5);

    drawEye(ctx, x + w * 0.38, bodyY + bodyH * 0.43, w * 0.12, bodyH * 0.16, 0, enemy.grounded ? 1 : 2, enemy.isBlinking);
    drawEye(ctx, x + w * 0.63, bodyY + bodyH * 0.43, w * 0.12, bodyH * 0.16, 0, enemy.grounded ? 1 : 2, enemy.isBlinking);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (enemy.grounded) {
        ctx.arc(x + w * 0.5, bodyY + bodyH * 0.67, w * 0.12, 0.08, Math.PI - 0.08);
    } else {
        ctx.arc(x + w * 0.5, bodyY + bodyH * 0.7, w * 0.09, 0, Math.PI * 2);
    }
    ctx.stroke();

    if (charge > 0.7) {
        const ready = (charge - 0.7) / 0.3;
        ctx.strokeStyle = `rgba(229, 255, 75, ${0.45 + ready * 0.45})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + w / 2, bodyY + bodyH / 2, w * (0.48 + ready * 0.13), Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
    }
}

function drawChaser(ctx, enemy, x, y, w, h) {
    const direction = enemy.vx >= 0 ? 1 : -1;
    const charge = enemy.dashCharging ? Math.min(1, enemy.dashChargeTime / enemy.dashChargeDuration) : 0;
    const squash = enemy.dashCharging ? 1 - charge * 0.2 : 1;
    const bodyH = h * 0.8 * squash;
    const bodyY = y + h - bodyH;

    if (enemy.isChasing) {
        const aura = ctx.createRadialGradient(x + w / 2, bodyY + bodyH / 2, w * 0.18, x + w / 2, bodyY + bodyH / 2, w * 0.78);
        aura.addColorStop(0, 'rgba(255, 61, 109, 0.28)');
        aura.addColorStop(1, 'rgba(255, 61, 109, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(x + w / 2, bodyY + bodyH / 2, w * 0.78, 0, Math.PI * 2);
        ctx.fill();
    }

    drawShadow(ctx, x + w / 2, y + h + 1, w * 0.4);
    ctx.save();
    ctx.translate(x + w / 2, 0);
    ctx.scale(direction, 1);
    ctx.translate(-(x + w / 2), 0);

    // Espinhos e cauda de cometa apontam contra o movimento.
    ctx.fillStyle = '#7b1b5a';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, bodyY + bodyH * 0.28);
    ctx.lineTo(x - w * 0.22, bodyY + bodyH * 0.16);
    ctx.lineTo(x + w * 0.08, bodyY + bodyH * 0.48);
    ctx.lineTo(x - w * 0.28, bodyY + bodyH * 0.68);
    ctx.lineTo(x + w * 0.17, bodyY + bodyH * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const body = ctx.createLinearGradient(x + w * 0.15, bodyY, x + w * 0.9, bodyY + bodyH);
    body.addColorStop(0, '#ff783f');
    body.addColorStop(0.45, '#ff365f');
    body.addColorStop(1, '#9d1a64');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.13, bodyY + bodyH * 0.51);
    ctx.quadraticCurveTo(x + w * 0.26, bodyY + bodyH * 0.04, x + w * 0.62, bodyY + bodyH * 0.08);
    ctx.lineTo(x + w * 0.78, bodyY - bodyH * 0.08);
    ctx.lineTo(x + w * 0.84, bodyY + bodyH * 0.19);
    ctx.quadraticCurveTo(x + w * 1.04, bodyY + bodyH * 0.46, x + w * 0.82, bodyY + bodyH * 0.82);
    ctx.quadraticCurveTo(x + w * 0.42, bodyY + bodyH * 1.05, x + w * 0.13, bodyY + bodyH * 0.51);
    ctx.closePath();
    fillAndStroke(ctx, body, 3.5);

    drawEye(ctx, x + w * 0.54, bodyY + bodyH * 0.38, w * 0.13, bodyH * 0.15, 1.5, 1, enemy.isBlinking);
    drawEye(ctx, x + w * 0.78, bodyY + bodyH * 0.37, w * 0.12, bodyH * 0.14, 1.5, 1, enemy.isBlinking);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.42, bodyY + bodyH * 0.24);
    ctx.lineTo(x + w * 0.62, bodyY + bodyH * 0.3);
    ctx.moveTo(x + w * 0.68, bodyY + bodyH * 0.29);
    ctx.lineTo(x + w * 0.89, bodyY + bodyH * 0.21);
    ctx.stroke();

    ctx.fillStyle = DEEP_INK;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.48, bodyY + bodyH * 0.64);
    ctx.quadraticCurveTo(x + w * 0.69, bodyY + bodyH * 0.84, x + w * 0.9, bodyY + bodyH * 0.59);
    ctx.quadraticCurveTo(x + w * 0.7, bodyY + bodyH * 0.7, x + w * 0.48, bodyY + bodyH * 0.64);
    ctx.fill();
    ctx.fillStyle = EYE_WHITE;
    for (let index = 0; index < 3; index++) {
        const tx = x + w * (0.57 + index * 0.1);
        ctx.beginPath();
        ctx.moveTo(tx, bodyY + bodyH * 0.66);
        ctx.lineTo(tx + w * 0.045, bodyY + bodyH * 0.75);
        ctx.lineTo(tx + w * 0.08, bodyY + bodyH * 0.65);
        ctx.fill();
    }
    ctx.restore();
}

function findShooterTarget(enemy) {
    return typeof enemy.detectNearestPlayer === 'function' ? enemy.detectNearestPlayer() : null;
}

function drawShooter(ctx, enemy, x, y, w, h) {
    const target = findShooterTarget(enemy);
    const aimX = target ? target.x + target.width / 2 - (enemy.x + w / 2) : 1;
    const aimY = target ? target.y + target.height / 2 - (enemy.y + h / 2) : 0;
    const angle = Math.atan2(aimY, aimX);
    const charge = enemy.isTelegraphing
        ? Math.min(1, enemy.telegraphTime / enemy.telegraphDuration)
        : Math.min(1, enemy.shootTimer / enemy.shootInterval);

    drawShadow(ctx, x + w / 2, y + h + 1, w * 0.42);

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(x + w * 0.17, y + h * 0.76, w * 0.66, h * 0.22, 6);
    ctx.fill();
    ctx.fillStyle = '#442a96';
    ctx.beginPath();
    ctx.roundRect(x + w * 0.22, y + h * 0.78, w * 0.56, h * 0.13, 5);
    ctx.fill();

    const armor = ctx.createLinearGradient(x + w * 0.16, y, x + w * 0.84, y + h);
    armor.addColorStop(0, '#57e5ff');
    armor.addColorStop(0.36, '#4d79e9');
    armor.addColorStop(0.68, '#7140bd');
    armor.addColorStop(1, '#3b226d');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.19, y + h * 0.76);
    ctx.lineTo(x + w * 0.1, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.16, y + h * 0.08, x + w * 0.5, y + h * 0.05);
    ctx.quadraticCurveTo(x + w * 0.84, y + h * 0.08, x + w * 0.9, y + h * 0.4);
    ctx.lineTo(x + w * 0.81, y + h * 0.76);
    ctx.closePath();
    fillAndStroke(ctx, armor, 3.5);

    ctx.strokeStyle = 'rgba(185, 245, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * 0.28);
    ctx.quadraticCurveTo(x + w * 0.31, y + h * 0.14, x + w * 0.47, y + h * 0.13);
    ctx.stroke();

    drawEye(ctx, x + w * 0.5, y + h * 0.37, w * 0.2, h * 0.18, Math.cos(angle) * 2, Math.sin(angle) * 2, enemy.isBlinking);
    ctx.fillStyle = enemy.isTelegraphing ? '#ff563f' : '#ffd43b';
    ctx.beginPath();
    ctx.arc(x + w * 0.5 + Math.cos(angle) * 2, y + h * 0.37 + Math.sin(angle) * 2, w * 0.065, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x + w * 0.5, y + h * 0.59);
    ctx.rotate(angle);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(-w * 0.04, -h * 0.1, w * 0.52, h * 0.2, 4);
    ctx.fill();
    const cannon = ctx.createLinearGradient(0, 0, w * 0.48, 0);
    cannon.addColorStop(0, '#6c45b9');
    cannon.addColorStop(0.7, '#3bcbe7');
    cannon.addColorStop(1, enemy.isTelegraphing ? '#fff15b' : '#ff8e35');
    ctx.fillStyle = cannon;
    ctx.beginPath();
    ctx.roundRect(0, -h * 0.06, w * 0.43, h * 0.12, 3);
    ctx.fill();
    ctx.fillStyle = enemy.isTelegraphing ? '#ffffff' : '#ffce42';
    ctx.beginPath();
    ctx.arc(w * 0.44, 0, w * (0.07 + charge * 0.035), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (target && charge > 0.58) {
        ctx.strokeStyle = enemy.isTelegraphing ? `rgba(255, 235, 80, ${0.55 + charge * 0.35})` : 'rgba(67, 225, 255, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.37, w * (0.27 + charge * 0.08), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
        ctx.stroke();
    }
}

export function drawCoverEnemy(ctx, enemy, camera = { x: 0, y: 0 }) {
    if (!enemy?.alive) return;

    const x = enemy.x - camera.x;
    const y = enemy.y - camera.y;
    const w = enemy.width;
    const h = enemy.height;

    ctx.save();
    switch (enemy.type) {
        case 'flyer':
            drawFlyer(ctx, enemy, x, y, w, h);
            break;
        case 'jumper':
            drawJumper(ctx, enemy, x, y, w, h);
            break;
        case 'chaser':
            drawChaser(ctx, enemy, x, y, w, h);
            break;
        case 'shooter':
            drawShooter(ctx, enemy, x, y, w, h);
            break;
        case 'walker':
        default:
            drawWalker(ctx, enemy, x, y, w, h);
            break;
    }
    ctx.restore();
}

export function drawCoverProjectile(ctx, projectile, camera = { x: 0, y: 0 }) {
    if (!projectile?.alive) return;

    const cx = projectile.x - camera.x + projectile.width / 2;
    const cy = projectile.y - camera.y + projectile.height / 2;
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const dx = projectile.vx / speed;
    const dy = projectile.vy / speed;

    const trail = ctx.createLinearGradient(cx - dx * 18, cy - dy * 18, cx, cy);
    trail.addColorStop(0, 'rgba(255, 68, 190, 0)');
    trail.addColorStop(0.45, 'rgba(54, 225, 255, 0.55)');
    trail.addColorStop(1, 'rgba(255, 229, 75, 0.9)');
    ctx.strokeStyle = trail;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - dx * 17, cy - dy * 17);
    ctx.lineTo(cx - dx * 2, cy - dy * 2);
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fill();
    const core = ctx.createRadialGradient(cx - 1.5, cy - 1.5, 0, cx, cy, 5);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.3, '#fff36b');
    core.addColorStop(0.68, '#29ddf2');
    core.addColorStop(1, '#a13bd1');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
}
