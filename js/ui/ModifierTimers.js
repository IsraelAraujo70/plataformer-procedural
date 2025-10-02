import { game } from '../game.js';

export function drawModifierTimers(ctx) {
    const timers = [];

    // Coletar timers ativos de todos os jogadores
    const players = [game.player, game.player2].filter(p => p && p.lives > 0);

    players.forEach(player => {
        if (player.jumpBoostTime > 0 && !timers.find(t => t.type === 'jump')) {
            timers.push({
                type: 'jump',
                time: player.getModifierTimeRemaining('jump'),
                progress: player.getModifierProgress('jump'),
                color: '#00d9ff',
                icon: '⬆️'
            });
        }

        if (player.speedBoostTime > 0 && !timers.find(t => t.type === 'speed')) {
            timers.push({
                type: 'speed',
                time: player.getModifierTimeRemaining('speed'),
                progress: player.getModifierProgress('speed'),
                color: '#00ff88',
                icon: '⚡'
            });
        }
    });

    if (timers.length === 0) return;

    // Desenhar timers centralizados no topo
    const timerWidth = 120;
    const timerHeight = 70;
    const spacing = 20;
    const totalWidth = timers.length * timerWidth + (timers.length - 1) * spacing;
    const startX = (game.width - totalWidth) / 2;
    const topY = 20;

    timers.forEach((timer, index) => {
        const x = startX + index * (timerWidth + spacing);
        const radius = 12; // Raio das bordas arredondadas

        // Função helper para desenhar retângulo arredondado
        function roundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }

        // Fundo do timer com bordas arredondadas e sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        roundRect(ctx, x, topY, timerWidth, timerHeight, radius);
        ctx.fill();

        // Borda colorida com glow
        ctx.shadowColor = timer.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = timer.color;
        ctx.lineWidth = 2.5;
        roundRect(ctx, x, topY, timerWidth, timerHeight, radius);
        ctx.stroke();

        // Resetar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Barra de progresso circular (anel ao redor do ícone)
        const centerX = x + timerWidth / 2;
        const centerY = topY + 28;
        const circleRadius = 22;
        const lineWidth = 3;

        // Anel de fundo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Anel de progresso
        ctx.strokeStyle = timer.color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * timer.progress);
        ctx.arc(centerX, centerY, circleRadius, startAngle, endAngle);
        ctx.stroke();

        // Círculo de fundo do ícone
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius - 4, 0, Math.PI * 2);
        ctx.fill();

        // Ícone
        ctx.font = '26px Arial';
        ctx.fillStyle = timer.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timer.icon, centerX, centerY);

        // Tempo restante com fundo
        const timeY = topY + timerHeight - 12;
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillStyle = timer.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Adicionar glow no texto do tempo
        ctx.shadowColor = timer.color;
        ctx.shadowBlur = 8;
        ctx.fillText(`${timer.time}s`, centerX, timeY);

        // Resetar sombra novamente
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    });

    ctx.textAlign = 'left'; // Reset
}
