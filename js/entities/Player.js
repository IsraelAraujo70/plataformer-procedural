import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// PLAYER
// ============================================
export class Player {
    constructor(x, y, playerNumber = 1) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.grounded = false;
        this.jumping = false;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.jumpBoost = 1;
        this.jumpBoostTime = 0;
        this.jumpBoostMaxTime = 0;
        this.speedBoost = 1;
        this.speedBoostTime = 0;
        this.speedBoostMaxTime = 0;
        this.shield = false;
        this.shieldTime = 0;
        this.shieldMaxTime = 0;
        this.reverseControls = false;
        this.reverseControlsTime = 0;
        this.reverseControlsMaxTime = 0;
        this.icyFloor = false;
        this.icyFloorTime = 0;
        this.icyFloorMaxTime = 0;
        this.doubleJumpEnabled = false;
        this.doubleJumpTime = 0;
        this.doubleJumpMaxTime = 0;
        this.hasDoubleJump = false;
        this.magnetActive = false;
        this.magnetTime = 0;
        this.magnetMaxTime = 0;
        this.tinyPlayer = false;
        this.tinyPlayerTime = 0;
        this.tinyPlayerMaxTime = 0;
        this.heavy = false;
        this.heavyTime = 0;
        this.heavyMaxTime = 0;
        this.bouncy = false;
        this.bouncyTime = 0;
        this.bouncyMaxTime = 0;
        this.timeWarp = false;
        this.timeWarpTime = 0;
        this.timeWarpMaxTime = 0;

        // Multiplayer: definir número do jogador e controles
        this.playerNumber = playerNumber;
        // Cores vibrantes estilo cartoon
        this.color = playerNumber === 1 ? '#00d9ff' : '#ff6b6b';
        this.colorDark = playerNumber === 1 ? '#0099cc' : '#cc3333'; // Sombra
        this.colorLight = playerNumber === 1 ? '#66efff' : '#ff9999'; // Highlight
        this.controls = playerNumber === 1 ?
            { left: 'a', right: 'd', up: 'w' } :
            { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp' };

        // Stats individuais por jogador
        this.hatCount = 1; // Sistema de chapéus empilháveis: cada chapéu = 1 hit extra
        this.maxHats = 5; // Limite máximo de chapéus
        this.hatTypes = []; // Array de tipos de chapéus coletados (por bioma)
        this.score = 0;
        this.lastDistance = 0; // Rastrear última distância para pontuação individual

        // Estatísticas detalhadas individuais
        this.stats = {
            coinsCollected: 0,
            enemiesDefeated: 0,
            modifiersCollected: 0
        };

        // Sistema de checkpoint
        this.lastSafeX = x;
        this.lastSafeY = y;

        // Animação de caminhada
        this.animFrame = 0;
        this.animCounter = 0;
        this.animSpeed = 4; // Frames de jogo entre cada frame de animação (mais rápido = mais fluido)
        this.facingRight = true;

        // Animação de morte
        this.dying = false;
        this.deathAnimTime = 0;
        this.deathAnimDuration = 60; // 1 segundo a 60fps

        // Animação squash & stretch AVANÇADA (efeito cartoon)
        this.squashStretch = 1.0; // 1.0 = normal, > 1 = esticado, < 1 = comprimido
        this.squashStretchVelocity = 0; // Velocidade da animação (spring physics)
        this.wasGroundedLastFrame = false;
        this.justJumped = false;

        // Sistema de antecipação (preparação antes do pulo)
        this.anticipating = false;
        this.anticipationTime = 0;
        this.anticipationDuration = 8; // frames de agachamento antes do pulo

        // Bounce na caminhada (pulo sutil ao andar)
        this.walkBounce = 0;
        this.walkBounceSpeed = 0.3;

        // Sistema de piscar olhos
        this.blinkTimer = 0;
        this.blinkDuration = 0;
        this.isBlinking = false;
        this.nextBlinkTime = Math.random() * 180 + 120; // 2-5 segundos

        // Rotação sutil do corpo durante movimento
        this.bodyRotation = 0;
        this.bodyRotationVelocity = 0;

        // Sistema de trail (rastro de movimento)
        this.trail = [];
        this.trailMaxLength = 8;
        this.trailTimer = 0;

        // Antena/topete com física de pêndulo
        this.antennaAngle = 0;       // Ângulo da antena (em radianos)
        this.antennaVelocity = 0;    // Velocidade angular da antena
        this.antennaLength = 12;     // Comprimento da antena
        this.antennaWidth = 3;       // Largura da antena

        // Sistema secreto de movimento avançado
        this.bhopCombo = 0;           // Contador de pulos bem-sucedidos (0-3)
        this.bhopScore = 0;           // Pontos acumulados (0-300)
        this.framesSinceGrounded = 0; // Frames desde que tocou o chão

        // Sistema de expressões faciais dinâmicas
        this.expression = 'normal';   // normal, scared, excited, dizzy, angry, determined
        this.expressionTimer = 0;     // Timer para controlar duração de expressões temporárias
    }

    update() {
        // Atualizar animação de morte
        if (this.dying) {
            this.deathAnimTime += game.deltaTimeFactor;

            // Efeito de queda e rotação
            this.vy += CONFIG.GRAVITY * 0.5 * game.deltaTimeFactor;
            this.y += this.vy * game.deltaTimeFactor;
            this.vx *= Math.pow(0.95, game.deltaTimeFactor); // Desacelerar horizontalmente
            this.x += this.vx * game.deltaTimeFactor;

            // Quando a animação terminar, marcar como completamente morto
            if (this.deathAnimTime >= this.deathAnimDuration) {
                this.completelyDead = true;

                // Disparar game over se necessário
                if (this.shouldTriggerGameOver) {
                    game.state = 'gameover';
                    if (window.showGameOver) {
                        window.showGameOver();
                    }
                }
            }
            return;
        }

        // Jogador morto não pode se mover (verificar com dying flag)
        if (this.dying) {
            return;
        }

        // Atualizar modificadores (usando deltaTimeFactor para consistência)
        if (this.jumpBoostTime > 0) {
            this.jumpBoostTime -= game.deltaTimeFactor;
            if (this.jumpBoostTime <= 0) {
                this.jumpBoost = 1;
                this.jumpBoostMaxTime = 0;
            }
        }

        if (this.speedBoostTime > 0) {
            this.speedBoostTime -= game.deltaTimeFactor;
            if (this.speedBoostTime <= 0) {
                this.speedBoost = 1;
                this.speedBoostMaxTime = 0;
            }
        }

        if (this.shieldTime > 0) {
            this.shieldTime -= game.deltaTimeFactor;
            if (this.shieldTime <= 0) {
                this.shield = false;
                this.shieldMaxTime = 0;
            }
        }

        if (this.reverseControlsTime > 0) {
            this.reverseControlsTime -= game.deltaTimeFactor;
            if (this.reverseControlsTime <= 0) {
                this.reverseControls = false;
                this.reverseControlsMaxTime = 0;
            }
        }

        if (this.icyFloorTime > 0) {
            this.icyFloorTime -= game.deltaTimeFactor;
            if (this.icyFloorTime <= 0) {
                this.icyFloor = false;
                this.icyFloorMaxTime = 0;
            }
        }

        if (this.doubleJumpTime > 0) {
            this.doubleJumpTime -= game.deltaTimeFactor;
            if (this.doubleJumpTime <= 0) {
                this.doubleJumpEnabled = false;
                this.doubleJumpMaxTime = 0;
                this.hasDoubleJump = false;
            }
        }

        if (this.magnetTime > 0) {
            this.magnetTime -= game.deltaTimeFactor;
            if (this.magnetTime <= 0) {
                this.magnetActive = false;
                this.magnetMaxTime = 0;
            }
        }

        if (this.tinyPlayerTime > 0) {
            this.tinyPlayerTime -= game.deltaTimeFactor;
            if (this.tinyPlayerTime <= 0) {
                this.tinyPlayer = false;
                this.tinyPlayerMaxTime = 0;
                // Restaurar tamanho original
                this.width = CONFIG.PLAYER_WIDTH;
                this.height = CONFIG.PLAYER_HEIGHT;
            } else if (this.tinyPlayer) {
                // Manter tamanho reduzido enquanto ativo
                this.width = CONFIG.PLAYER_WIDTH * 0.5;
                this.height = CONFIG.PLAYER_HEIGHT * 0.5;
            }
        }

        if (this.heavyTime > 0) {
            this.heavyTime -= game.deltaTimeFactor;
            if (this.heavyTime <= 0) {
                this.heavy = false;
                this.heavyMaxTime = 0;
            }
        }

        if (this.bouncyTime > 0) {
            this.bouncyTime -= game.deltaTimeFactor;
            if (this.bouncyTime <= 0) {
                this.bouncy = false;
                this.bouncyMaxTime = 0;
            }
        }

        // TimeWarp é atualizado no main.js para evitar decremento duplo durante aceleração

        // DEV MODE: Controles especiais
        if (game.devMode.enabled && game.devMode.noclip) {
            const flySpeed = game.devMode.flySpeed;

            // Voo livre (ignora física)
            this.vx = 0;
            this.vy = 0;

            if (game.keys[this.controls.left]) {
                this.x -= flySpeed;
            }
            if (game.keys[this.controls.right]) {
                this.x += flySpeed;
            }
            if (game.keys[this.controls.up]) {
                this.y -= flySpeed;
            }
            if (game.keys['s'] || game.keys['ArrowDown']) {
                this.y += flySpeed;
            }

            // Não aplicar gravidade ou colisões no noclip
            return;
        }

        // Controles normais (com inversão se reverseControls ativo)
        let moveSpeed = CONFIG.MOVE_SPEED * this.speedBoost;
        if (game.devMode.enabled) moveSpeed *= 2; // Velocidade dobrada em dev mode

        const leftKey = this.reverseControls ? this.controls.right : this.controls.left;
        const rightKey = this.reverseControls ? this.controls.left : this.controls.right;

        if (game.keys[leftKey]) {
            this.vx = -moveSpeed;
            this.facingRight = false;
        } else if (game.keys[rightKey]) {
            this.vx = moveSpeed;
            this.facingRight = true;
        } else {
            // Aplicar fricção (reduzida se icyFloor ativo)
            this.vx *= this.icyFloor ? 0.98 : CONFIG.FRICTION;
        }

        // Atualizar animação de caminhada (quando está se movendo)
        if (Math.abs(this.vx) > 0.5) {
            const currentAnimSpeed = this.speedBoost > 1 ? Math.floor(this.animSpeed / 1.5) : this.animSpeed;
            // Usar deltaTimeFactor para manter velocidade de animação consistente
            this.animCounter += game.deltaTimeFactor;
            if (this.animCounter >= currentAnimSpeed) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animCounter = 0;
            }
        } else {
            this.animFrame = 0;
            this.animCounter = 0;
        }

        // Pulo individual (W ou Seta para cima)
        if (game.keys[this.controls.up] && this.grounded && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost;
            if (this.heavy) jumpStrength *= 0.7; // Heavy reduz força do pulo em 30%
            if (game.devMode.enabled) jumpStrength *= 1.5; // Super pulo em dev mode

            // DEBUG: Log bunny hop
            console.log(`🐰 P${this.playerNumber} JUMP: frames=${this.framesSinceGrounded}, combo=${this.bhopCombo}, score=${this.bhopScore}`);

            // Sistema secreto: detectar timing e acumular pontos
            if (this.framesSinceGrounded >= 1 && this.framesSinceGrounded <= 5) {
                // Calcular pontos baseado na precisão
                // Usar ranges ao invés de comparações exatas para funcionar com deltaTime
                let points = 0;
                if (this.framesSinceGrounded >= 2.5 && this.framesSinceGrounded < 3.5) {
                    points = 100; // Centro perfeito (frame 3)
                } else if ((this.framesSinceGrounded >= 1.5 && this.framesSinceGrounded < 2.5) ||
                           (this.framesSinceGrounded >= 3.5 && this.framesSinceGrounded < 4.5)) {
                    points = 75;  // Bom (frames 2 ou 4)
                } else if ((this.framesSinceGrounded >= 1 && this.framesSinceGrounded < 1.5) ||
                           (this.framesSinceGrounded >= 4.5 && this.framesSinceGrounded <= 5)) {
                    points = 50;  // Ok (frames 1 ou 5)
                }

                console.log(`✅ ACCEPTED! Points: ${points}`);
                this.bhopCombo++;
                this.bhopScore += points;
                this.spawnBhopDust(points);

                // 3º pulo: aplicar super boost baseado no score acumulado
                if (this.bhopCombo === 3) {
                    const scoreMultiplier = 1.0 + (this.bhopScore / 200) * 0.8;
                    jumpStrength *= scoreMultiplier;
                    console.log(`🚀 SUPER JUMP! Multiplier: ${scoreMultiplier.toFixed(2)}x`);
                    // Reset após o super pulo
                    this.bhopCombo = 0;
                    this.bhopScore = 0;
                }
            } else if (this.framesSinceGrounded > 5) {
                // Errou a janela: reset completo
                console.log(`❌ TOO LATE! Combo reset`);
                this.bhopCombo = 0;
                this.bhopScore = 0;
            }

            this.vy = jumpStrength;
            this.jumping = true;
            this.grounded = false;
            this.justJumped = true; // Trigger animação de stretch

            // Som de pulo
            game.soundManager?.playJump();
        }

        // Pulo conjunto (ESPAÇO faz ambos pularem)
        if (game.keys[' '] && this.grounded && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost;
            if (this.heavy) jumpStrength *= 0.7; // Heavy reduz força do pulo em 30%
            if (game.devMode.enabled) jumpStrength *= 1.5;

            // Sistema secreto: detectar timing e acumular pontos
            if (this.framesSinceGrounded >= 2 && this.framesSinceGrounded <= 5) {
                // Calcular pontos baseado na precisão
                // Usar ranges ao invés de comparações exatas para funcionar com deltaTime
                let points = 0;
                if (this.framesSinceGrounded >= 2.5 && this.framesSinceGrounded < 3.5) {
                    points = 100; // Centro perfeito (frame 3)
                } else if ((this.framesSinceGrounded >= 2 && this.framesSinceGrounded < 2.5) ||
                           (this.framesSinceGrounded >= 3.5 && this.framesSinceGrounded < 4.5)) {
                    points = 75;  // Bom (frames 2 ou 4)
                } else if (this.framesSinceGrounded >= 4.5 && this.framesSinceGrounded <= 5) {
                    points = 50;  // Ok (frame 5)
                }

                this.bhopCombo++;
                this.bhopScore += points;
                this.spawnBhopDust(points);

                // 3º pulo: aplicar super boost baseado no score acumulado
                if (this.bhopCombo === 3) {
                    const scoreMultiplier = 1.0 + (this.bhopScore / 200) * 0.8;
                    jumpStrength *= scoreMultiplier;
                    // Reset após o super pulo
                    this.bhopCombo = 0;
                    this.bhopScore = 0;
                }
            } else if (this.framesSinceGrounded > 5) {
                // Errou a janela: reset completo
                this.bhopCombo = 0;
                this.bhopScore = 0;
            }

            this.vy = jumpStrength;
            this.jumping = true;
            this.grounded = false;
            this.justJumped = true; // Trigger animação de stretch

            // Som de pulo
            game.soundManager?.playJump();
        }

        // Double Jump (pulo no ar se modificador ativo)
        if (game.keys[this.controls.up] && !this.grounded && this.doubleJumpEnabled && this.hasDoubleJump && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost * 0.9; // Double jump um pouco mais fraco
            if (game.devMode.enabled) jumpStrength *= 1.5;
            this.vy = jumpStrength;
            this.hasDoubleJump = false; // Consumir o double jump
            this.jumping = true;
            this.justJumped = true; // Trigger animação de stretch

            // Som de pulo (double jump)
            game.soundManager?.playJump();
        }

        if (game.keys[' '] && !this.grounded && this.doubleJumpEnabled && this.hasDoubleJump && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost * 0.9;
            if (game.devMode.enabled) jumpStrength *= 1.5;
            this.vy = jumpStrength;
            this.hasDoubleJump = false;
            this.jumping = true;
            this.justJumped = true; // Trigger animação de stretch

            // Som de pulo (double jump)
            game.soundManager?.playJump();
        }

        if (!game.keys[this.controls.up] && !game.keys[' ']) {
            this.jumping = false;
        }

        // Resetar double jump ao tocar o chão
        if (this.grounded && this.doubleJumpEnabled) {
            this.hasDoubleJump = true;
        }

        // Gravidade (pode ser desativada em dev mode)
        if (game.devMode.gravityEnabled) {
            let gravity = CONFIG.GRAVITY;
            if (this.heavy) gravity *= 1.7; // Heavy aumenta gravidade em 70%
            this.vy += gravity * game.deltaTimeFactor;
        }

        // Limites de velocidade
        const maxVelocity = 20;
        if (this.vy > maxVelocity) this.vy = maxVelocity;

        // Atualizar posição (usando deltaTimeFactor para consistência)
        this.x += this.vx * game.deltaTimeFactor;
        this.y += this.vy * game.deltaTimeFactor;

        // Colisões com terreno
        const wasGrounded = this.grounded; // Salvar estado ANTES de resetar
        const previousVY = this.vy; // Salvar vy ANTES de handleCollisions zerar
        this.grounded = false;
        this.handleCollisions();

        // Bouncy: dar bounce ao colidir com o chão (usar vy anterior)
        if (this.bouncy && this.grounded && !wasGrounded && previousVY > 2) {
            this.vy = -previousVY * 0.5; // Bounce com 50% da velocidade de queda
        }

        // ============================================
        // SQUASH & STRETCH ANIMATION AVANÇADA (Spring Physics)
        // ============================================

        // Detectar pouso IMPACTANTE (chegou no chão agora)
        if (this.grounded && !wasGrounded) {
            const impactForce = Math.min(previousVY / 10, 1.5); // Força baseada na velocidade
            this.squashStretch = Math.max(0.4, 1.0 - impactForce * 0.6); // Comprimir MUITO ao pousar
            this.squashStretchVelocity = 0;

            // Resetar contador de bunny hop ao pousar
            this.framesSinceGrounded = 0;

            // Partículas de impacto no pouso
            if (previousVY > 5 && window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height, this.color, Math.floor(impactForce * 8));
            }
        }

        // Esticar MUITO ao pular (antecipação)
        if (this.justJumped) {
            this.squashStretch = 1.6; // Esticar MUITO ao iniciar pulo
            this.squashStretchVelocity = 0.15;
            this.justJumped = false;
        }

        // Spring physics para squash & stretch (movimento suave e elástico)
        const targetSquash = 1.0;
        const springStiffness = 0.15;
        const springDamping = 0.7;

        // Aplicar física de mola
        const squashError = targetSquash - this.squashStretch;
        this.squashStretchVelocity += squashError * springStiffness;
        this.squashStretchVelocity *= springDamping;
        this.squashStretch += this.squashStretchVelocity;

        // Limitar valores extremos
        this.squashStretch = Math.max(0.4, Math.min(1.8, this.squashStretch));

        // ============================================
        // WALK BOUNCE (Pulo sutil ao andar)
        // ============================================
        if (this.grounded && Math.abs(this.vx) > 0.5) {
            const oldBounce = this.walkBounce;
            this.walkBounce += this.walkBounceSpeed * (this.speedBoost > 1 ? 1.5 : 1);

            // Criar partículas de poeira quando o pé toca o chão (bounce no pico)
            const bouncePhase = Math.sin(this.walkBounce);
            const oldPhase = Math.sin(oldBounce);

            if (bouncePhase < 0 && oldPhase >= 0 && window.createParticles) {
                // Pé tocou o chão!
                const footX = this.x + this.width / 2 + (this.facingRight ? 5 : -5);
                const footY = this.y + this.height + 4;
                window.createParticles(footX, footY, '#aa8866', 3);
            }
        } else {
            this.walkBounce = 0;
        }

        // ============================================
        // BODY ROTATION (Rotação sutil ao virar)
        // ============================================
        let targetRotation = 0;
        if (this.grounded && Math.abs(this.vx) > 1) {
            targetRotation = this.vx * 0.03; // Inclinar na direção do movimento
        }

        const rotationError = targetRotation - this.bodyRotation;
        this.bodyRotationVelocity += rotationError * 0.2;
        this.bodyRotationVelocity *= 0.8;
        this.bodyRotation += this.bodyRotationVelocity;
        this.bodyRotation = Math.max(-0.15, Math.min(0.15, this.bodyRotation));

        // ============================================
        // BLINK ANIMATION (Piscar olhos)
        // ============================================
        this.blinkTimer += game.deltaTimeFactor;

        if (this.isBlinking) {
            this.blinkDuration += game.deltaTimeFactor;
            if (this.blinkDuration >= 8) { // Piscar dura 8 frames
                this.isBlinking = false;
                this.blinkDuration = 0;
                this.nextBlinkTime = this.blinkTimer + Math.random() * 180 + 120; // Próximo piscar em 2-5s
            }
        } else if (this.blinkTimer >= this.nextBlinkTime) {
            this.isBlinking = true;
            this.blinkTimer = 0;
        }

        // ============================================
        // TRAIL SYSTEM (Rastro de movimento)
        // ============================================
        this.trailTimer += game.deltaTimeFactor;

        // Criar trail quando se movendo rápido
        if (Math.abs(this.vx) > 2 || Math.abs(this.vy) > 5) {
            if (Math.floor(this.trailTimer) % 3 === 0 && Math.floor(this.trailTimer - game.deltaTimeFactor) % 3 !== 0) { // A cada 3 frames
                this.trail.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    life: 15,
                    maxLife: 15,
                    squash: this.squashStretch,
                    rotation: this.bodyRotation
                });
            }
        }

        // Atualizar e remover trails antigos
        this.trail = this.trail.filter(t => {
            t.life -= game.deltaTimeFactor;
            return t.life > 0;
        });

        // Limitar tamanho do array
        if (this.trail.length > this.trailMaxLength) {
            this.trail.shift();
        }

        // Atualizar estado do frame anterior
        this.wasGroundedLastFrame = this.grounded;

        // Sistema secreto: rastreamento de frames e reset
        if (this.grounded) {
            // Incrementar sempre que estiver no chão (USAR INCREMENTO FIXO, não deltaTime)
            // Bunny hop é baseado em timing de input, não em tempo físico
            this.framesSinceGrounded++;
            // Reset automático se ficar parado no chão
            if (this.framesSinceGrounded > 10) {
                this.bhopCombo = 0;
                this.bhopScore = 0;
            }
        }
        // NÃO resetar quando no ar - precisa manter o valor do último toque no chão!

        // ============================================
        // FÍSICA DE PÊNDULO: BRAÇOS E ANTENA
        // ============================================
        this.updatePendulumPhysics();

        // Salvar última posição segura quando está no chão
        if (this.grounded) {
            this.lastSafeX = this.x;
            this.lastSafeY = this.y;
        }

        // Limites do mundo - respawn ao invés de game over imediato
        if (this.y > game.height + 100) {
            this.respawn();
        }

        // Invulnerabilidade
        if (this.invulnerable) {
            this.invulnerableTime -= game.deltaTimeFactor;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Sistema de magnetismo - atrair moedas e modificadores próximos
        if (this.magnetActive) {
            this.attractNearbyItems();
        }

        // Atualizar distância individual e pontuar cada jogador independentemente
        const currentDistance = Math.floor(this.x / CONFIG.TILE_SIZE);

        // Cada jogador ganha pontos pela sua própria progressão
        if (currentDistance > this.lastDistance) {
            const distanceDiff = currentDistance - this.lastDistance;
            this.score += distanceDiff;
            this.lastDistance = currentDistance;
        }

        // Atualizar game.distance global (máximo entre todos os jogadores)
        // Usado para gerar chunks e aumentar dificuldade
        const rightmostX = game.twoPlayerMode && game.player2 ?
            Math.max(game.player.x, game.player2.x) :
            this.x;

        const globalDistance = Math.floor(rightmostX / CONFIG.TILE_SIZE);
        if (globalDistance > game.distance) {
            game.distance = globalDistance;
        }

        game.difficulty = Math.floor(game.distance / 100); // Aumenta a cada 100 tiles

        // ============================================
        // SISTEMA DE EXPRESSÕES FACIAIS DINÂMICAS
        // ============================================
        this.updateExpression();
    }

    updateExpression() {
        // Atualizar timer de expressão
        this.expressionTimer += game.deltaTimeFactor;

        // Prioridade de expressões (ordem importa!)

        // 1. DIZZY - Controles invertidos (alta prioridade)
        if (this.reverseControls) {
            this.expression = 'dizzy';
            return;
        }

        // 2. SCARED - Caindo de grande altura
        if (!this.grounded && this.vy > 8) {
            this.expression = 'scared';
            return;
        }

        // 3. ANGRY - Acabou de tomar dano (invulnerável mas perdeu chapéu)
        if (this.invulnerable && this.invulnerableTime > 60 && this.hatCount < this.maxHats) {
            this.expression = 'angry';
            return;
        }

        // 4. DETERMINED - Bunny hop combo ativo
        if (this.bhopCombo > 0) {
            this.expression = 'determined';
            return;
        }

        // 5. EXCITED - Velocidade alta
        if (this.speedBoost > 1 || Math.abs(this.vx) > 6) {
            this.expression = 'excited';
            return;
        }

        // 6. NORMAL - Estado padrão
        this.expression = 'normal';
    }

    updatePendulumPhysics() {
        // Constantes da física de pêndulo
        const damping = 0.88;        // Amortecimento (quanto maior, mais suave)
        const restoring = 0.12;      // Força restauradora (retorna à posição neutra)
        const maxAngle = 0.785;      // Ângulo máximo (45 graus em radianos)

        // ============================================
        // ANTENA/TOPETE
        // ============================================
        // Antena balança OPOSTO ao movimento (inércia) - invertido com sinal negativo
        const antennaForce = -this.vx * 0.05 + this.vy * 0.03;

        this.antennaVelocity += antennaForce - this.antennaAngle * restoring;
        this.antennaVelocity *= damping;
        this.antennaAngle += this.antennaVelocity;
        this.antennaAngle = Math.max(-maxAngle, Math.min(maxAngle, this.antennaAngle));

        // Efeito extra: antena balança mais ao pousar
        if (this.grounded && !this.wasGroundedLastFrame) {
            this.antennaVelocity += 0.3; // Impulso ao pousar
        }
    }

    handleCollisions() {
        const startChunk = Math.floor((this.x - 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            chunk.platforms.forEach(platform => {
                if (this.intersects(platform)) {
                    // Detectar de que lado veio a colisão
                    const overlapLeft = (this.x + this.width) - platform.x;
                    const overlapRight = (platform.x + platform.width) - this.x;
                    const overlapTop = (this.y + this.height) - platform.y;
                    const overlapBottom = (platform.y + platform.height) - this.y;

                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    // Colisão vertical
                    if (minOverlap === overlapTop && this.vy > 0) {
                        this.y = platform.y - this.height;
                        this.vy = 0;

                        // Som de aterrissagem (apenas se estava no ar)
                        if (!this.grounded) {
                            game.soundManager?.playLand();
                        }

                        this.grounded = true;
                    }
                    // Head bump
                    else if (minOverlap === overlapBottom && this.vy < 0) {
                        this.y = platform.y + platform.height;
                        this.vy = 0;
                    }
                    // Colisão horizontal
                    else if (minOverlap === overlapLeft) {
                        this.x = platform.x - this.width;
                        this.vx = 0;
                    }
                    else if (minOverlap === overlapRight) {
                        this.x = platform.x + platform.width;
                        this.vx = 0;
                    }
                }
            });
        }
    }

    intersects(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }


    attractNearbyItems() {
        const magnetRange = 150; // Raio de atração em pixels
        const attractionSpeed = 8; // Velocidade de atração

        // Calcular centro do jogador
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;

        // Verificar chunks próximos
        const startChunk = Math.floor((this.x - magnetRange) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + magnetRange) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            // Atrair moedas
            chunk.coins.forEach(coin => {
                if (coin.collected) return;

                const coinCenterX = coin.x + coin.width / 2;
                const coinCenterY = coin.y + coin.height / 2;

                const dx = playerCenterX - coinCenterX;
                const dy = playerCenterY - coinCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Se dentro do alcance do ímã, mover em direção ao jogador
                if (distance < magnetRange && distance > 5) {
                    const moveX = (dx / distance) * attractionSpeed;
                    const moveY = (dy / distance) * attractionSpeed;
                    coin.x += moveX;
                    coin.y += moveY;
                }
            });

            // Atrair modificadores (opcional, pode comentar se achar muito OP)
            chunk.modifiers.forEach(modifier => {
                if (modifier.collected) return;

                const modCenterX = modifier.x + modifier.width / 2;
                const modCenterY = modifier.y + modifier.height / 2;

                const dx = playerCenterX - modCenterX;
                const dy = playerCenterY - modCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Se dentro do alcance do ímã, mover em direção ao jogador
                if (distance < magnetRange && distance > 5) {
                    const moveX = (dx / distance) * attractionSpeed;
                    const moveY = (dy / distance) * attractionSpeed;
                    modifier.x += moveX;
                    modifier.y += moveY;
                }
            });
        }
    }

    respawn() {
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: não perde vida

        // Cair do mapa funciona como tomar dano
        if (this.hatCount > 0) {
            // Perde 1 chapéu ao cair (do topo da pilha)
            this.hatCount--;

            // Remover o último chapéu do array (topo da pilha)
            const lostHatType = this.hatTypes.pop();

            // Remover efeito do chapéu perdido
            if (lostHatType) {
                this.applyHatEffect(lostHatType, 'lose');
            }

            // Criar chapéu "dropping" (animação de cair e sumir)
            const hatX = this.x + this.width / 2 - 10;
            const hatY = this.y - 8;

            import('./Hat.js').then(module => {
                const droppingHat = new module.Hat(hatX, hatY, 'dropping', lostHatType || 'plains');
                if (!game.droppingHats) game.droppingHats = [];
                game.droppingHats.push(droppingHat);
            });

            // Efeitos visuais
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y, '#8b4513', 15);
            }

            // Teleportar para última posição segura
            this.x = this.lastSafeX;
            this.y = this.lastSafeY;
            this.vx = 0;
            this.vy = 0;

            // Invulnerabilidade temporária
            this.invulnerable = true;
            this.invulnerableTime = 90; // 1.5 segundos a 60fps
        } else {
            // Sem chapéu = morte imediata
            this.die();
        }
    }

    takeDamage() {
        if (this.invulnerable) return;
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: invencível

        // Shield absorve o dano
        if (this.shield) {
            this.shield = false;
            this.shieldTime = 0;
            this.shieldMaxTime = 0;

            // Som de shield quebrando
            game.soundManager?.playShieldBreak();

            // Efeito visual de shield quebrado
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffaa00', 20);
            }
            if (window.createFloatingText) {
                window.createFloatingText('SHIELD!', this.x + this.width / 2, this.y, '#ffaa00');
            }

            // Aplicar invulnerabilidade temporária após quebrar shield
            this.invulnerable = true;
            this.invulnerableTime = 30; // 0.5 segundos a 60fps
            return; // Shield protegeu
        }

        // Sistema de chapéus empilháveis
        if (this.hatCount > 0) {
            // Som de dano (perdeu chapéu)
            game.soundManager?.playDamage();

            // Perde 1 chapéu do topo da pilha
            this.hatCount--;

            // Remover o último chapéu do array (topo da pilha)
            const lostHatType = this.hatTypes.pop();

            // Remover efeito do chapéu perdido
            if (lostHatType) {
                this.applyHatEffect(lostHatType, 'lose');
            }

            // Criar chapéu "dropping" (animação de cair e sumir)
            const hatX = this.x + this.width / 2 - 10;
            const hatY = this.y - 8; // Posição da antena

            // Importar Hat dinamicamente e criar instância tipo 'dropping'
            import('./Hat.js').then(module => {
                const droppingHat = new module.Hat(hatX, hatY, 'dropping', lostHatType || 'plains');
                if (!game.droppingHats) game.droppingHats = [];
                game.droppingHats.push(droppingHat);
            });

            // Efeitos visuais
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y, '#8b4513', 15);
            }

            // Invulnerabilidade temporária
            this.invulnerable = true;
            this.invulnerableTime = 90; // 1.5 segundos a 60fps
            this.vy = CONFIG.JUMP_STRENGTH * 0.7; // Knockback
        } else {
            // Sem chapéus: morte imediata
            this.die();
        }
    }

    applyHatEffect(biomeType, action) {
        // action: 'gain' ou 'lose'
        const hatData = this.getHatData(biomeType);
        if (!hatData || !hatData.effect) return;

        const effect = hatData.effect;
        const isGaining = action === 'gain';

        switch (effect) {
            case 'light':
                // Miner Helmet: iluminação extra (implementar quando tiver sistema de luz)
                console.log(`Player ${this.playerNumber}: ${isGaining ? 'Gained' : 'Lost'} light effect`);
                break;

            case 'warmth':
                // Fur Hat: reduz deslizamento no gelo
                // TODO: implementar quando tiver mais controle sobre física do gelo
                console.log(`Player ${this.playerNumber}: ${isGaining ? 'Gained' : 'Lost'} warmth effect`);
                break;

            case 'heat_resistance':
                // Turban: resistência ao calor (inimigos causam menos dano?)
                console.log(`Player ${this.playerNumber}: ${isGaining ? 'Gained' : 'Lost'} heat resistance`);
                break;

            case 'jump_boost':
                // Pilot Cap: boost no pulo
                if (isGaining) {
                    this.jumpBoost = Math.max(this.jumpBoost, 1.15);
                } else {
                    // Verificar se ainda tem outro chapéu com jump_boost
                    const hasOtherJumpBoost = this.hatTypes.some(type =>
                        type !== biomeType && this.getHatData(type)?.effect === 'jump_boost'
                    );
                    if (!hasOtherJumpBoost) {
                        this.jumpBoost = 1;
                    }
                }
                break;

            case 'damage_reduction':
                // Combat Helmet: aumenta invulnerabilidade após dano
                console.log(`Player ${this.playerNumber}: ${isGaining ? 'Gained' : 'Lost'} damage reduction`);
                break;

            case 'low_gravity':
                // Astronaut Helmet: melhor controle em baixa gravidade
                console.log(`Player ${this.playerNumber}: ${isGaining ? 'Gained' : 'Lost'} low gravity control`);
                break;

            case 'ultimate':
                // Void Crown: todos os efeitos
                if (isGaining) {
                    this.jumpBoost = Math.max(this.jumpBoost, 1.3);
                    console.log(`Player ${this.playerNumber}: Gained ULTIMATE power!`);
                } else {
                    this.jumpBoost = 1;
                    console.log(`Player ${this.playerNumber}: Lost ultimate power`);
                }
                break;
        }
    }

    getHatData(biomeType) {
        // Importar HAT_TYPES dinamicamente
        const HAT_TYPES = {
            PLAINS: { effect: null },
            CAVE: { effect: 'light' },
            ICE: { effect: 'warmth' },
            DESERT: { effect: 'heat_resistance' },
            SKY: { effect: 'jump_boost' },
            APOCALYPSE: { effect: 'damage_reduction' },
            MOON: { effect: 'low_gravity' },
            BLACK_HOLE: { effect: 'ultimate' }
        };
        return HAT_TYPES[biomeType.toUpperCase()];
    }

    die() {
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: não morre

        // Som de morte
        game.soundManager?.playDeath();

        // Iniciar animação de morte
        this.dying = true;
        this.deathAnimTime = 0;
        this.completelyDead = false;

        // Impulso para cima e para trás ao morrer
        this.vy = -8;
        this.vx = this.facingRight ? -3 : 3;

        // Criar partículas de morte
        if (window.createParticles) {
            window.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 50);
        }

        // Em modo 2 jogadores, verificar se o outro ainda está vivo
        if (game.twoPlayerMode) {
            const otherPlayer = this.playerNumber === 1 ? game.player2 : game.player;
            if (otherPlayer && !otherPlayer.dying && !otherPlayer.completelyDead) {
                // Other player still alive, no game over
                console.log(`Player ${this.playerNumber} died, but Player ${otherPlayer.playerNumber} continues!`);
                this.shouldTriggerGameOver = false;
                // Dead player continues in game but can no longer be controlled
                // Animation will play and then player disappears
                return;
            }
        }

        // Game over (modo 1P ou ambos morreram em 2P)
        // Ao invés de game over imediato, mostrar modal de continue (rewarded ad)
        this.shouldTriggerGameOver = false; // Não trigger imediato

        // Importar e mostrar modal de continuação após animação de morte
        import('../ui/ContinueModal.js').then(module => {
            // Aguardar animação de morte terminar antes de mostrar modal
            setTimeout(() => {
                // VALIDAÇÕES CRÍTICAS antes de mostrar modal:
                // 1. Player ainda está morrendo?
                // 2. Jogo está em estado válido (playing)?
                // 3. Player ainda existe?
                if (this.dying && game.state === 'playing' && this) {
                    module.showContinueModal(this);
                } else {
                    console.warn('⚠️ Skipping continue modal - game state:', game.state, 'dying:', this.dying);
                }
            }, this.deathAnimDuration * (1000 / 60)); // Converter frames para ms
        }).catch(error => {
            console.error('❌ Failed to load ContinueModal:', error);
        });
    }

    draw(ctx) {
        // Não desenhar se completamente morto
        if (this.completelyDead) {
            return;
        }

        // Efeito de piscar quando invulnerável
        if (this.invulnerable && Math.floor(this.invulnerableTime / 5) % 2 === 0) {
            return;
        }

        // ============================================
        // DESENHAR TRAIL (RASTRO) antes do personagem
        // ============================================
        this.trail.forEach((t, index) => {
            const alpha = t.life / t.maxLife;
            const trailScreenX = t.x - game.camera.x;
            const trailScreenY = t.y - game.camera.y;
            const size = this.width * 0.8 * alpha; // Diminui com o tempo

            ctx.save();
            ctx.globalAlpha = alpha * 0.4;
            ctx.translate(trailScreenX, trailScreenY);
            ctx.rotate(t.rotation);

            // Desenhar forma blob do trail
            const radiusX = size / 2;
            const radiusY = (size / 2) * t.squash;

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Aplicar walk bounce (pulo sutil ao andar)
        const bounceOffset = Math.sin(this.walkBounce) * 2;
        const finalScreenY = screenY - bounceOffset;

        // Salvar contexto para aplicar transformações
        ctx.save();

        // Verificar se está sendo sugado pelo buraco negro
        const beingSucked = game.victoryTriggered && game.blackHoleSuctionProgress > 0;

        // ============================================
        // APLICAR SQUASH & STRETCH + ROTAÇÃO
        // ============================================
        if (!this.dying && !beingSucked) {
            // Centro de transformação: base do personagem (pés)
            const centerX = screenX + this.width / 2;
            const centerY = finalScreenY + this.height; // Base (pés)

            // Mover origem para base do personagem
            ctx.translate(centerX, centerY);

            // ROTAÇÃO do corpo (inclinação ao mover)
            ctx.rotate(this.bodyRotation);

            // Aplicar escala vertical e compensar horizontalmente
            // (Princípio de conservação de volume da animação cartoon)
            const horizontalSquash = 1.0 + (1.0 - this.squashStretch) * 0.6; // Mais exagerado!
            ctx.scale(horizontalSquash, this.squashStretch);

            // Retornar origem
            ctx.translate(-centerX, -centerY);
        }

        // Aplicar transparência e rotação durante animação de morte
        if (this.dying) {
            // Calcular opacidade (fade out)
            const opacity = 1 - (this.deathAnimTime / this.deathAnimDuration);
            ctx.globalAlpha = opacity;

            // Calcular rotação (girar enquanto cai)
            const rotation = (this.deathAnimTime / this.deathAnimDuration) * Math.PI * 2;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;

            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.translate(-centerX, -centerY);
        }

        // Aplicar transparência e rotação durante sucção pelo buraco negro
        if (beingSucked) {
            // Calcular opacidade (fade out progressivo)
            const opacity = 1 - game.blackHoleSuctionProgress;
            ctx.globalAlpha = opacity;

            // Aplicar rotação (2 voltas completas)
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;

            ctx.translate(centerX, centerY);
            ctx.rotate(game.blackHoleSuctionRotation);
            ctx.translate(-centerX, -centerY);
        }

        // Auras de power-ups (circulares para combinar com o formato blob)
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        const auraRadius = Math.max(this.width, this.height) / 2 + 4;

        if (this.jumpBoostTime > 0) {
            ctx.fillStyle = 'rgba(0, 217, 255, 0.3)';
            ctx.shadowColor = '#00d9ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (this.speedBoostTime > 0) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (this.shield) {
            // Aura dourada brilhante do shield
            ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Borda circular do shield
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.reverseControls) {
            // Aura rosa/vermelha pulsante para controles invertidos
            const pulsate = 0.3 + Math.sin(Date.now() / 200) * 0.15;
            ctx.fillStyle = `rgba(255, 0, 102, ${pulsate})`;
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (this.icyFloor) {
            // Aura azul clara cristalina (efeito de gelo)
            ctx.fillStyle = 'rgba(102, 255, 255, 0.35)';
            ctx.shadowColor = '#66ffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Pequenos "cristais de gelo" ao redor
            ctx.fillStyle = '#66ffff';
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2) + Math.PI / 4;
                const px = centerX + Math.cos(angle) * auraRadius;
                const py = centerY + Math.sin(angle) * auraRadius;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (this.doubleJumpEnabled) {
            // Aura roxa do double jump
            ctx.fillStyle = 'rgba(157, 0, 255, 0.35)';
            ctx.shadowColor = '#9d00ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (this.magnetActive) {
            // Aura dourada com efeito de partículas girando
            const time = Date.now() / 1000;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Pequenas partículas girando ao redor
            for (let i = 0; i < 4; i++) {
                const angle = time * 2 + (i * Math.PI / 2);
                const radius = auraRadius + 6;
                const px = centerX + Math.cos(angle) * radius;
                const py = centerY + Math.sin(angle) * radius;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (this.tinyPlayer) {
            // Aura rosa (Tiny Player)
            ctx.fillStyle = 'rgba(255, 20, 147, 0.35)';
            ctx.shadowColor = '#ff1493';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (this.heavy) {
            // Aura marrom escura com efeito de peso
            ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
            ctx.shadowColor = '#8b4513';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Linhas de gravidade (setas verticais para baixo)
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2 / 3) + Math.PI / 2;
                const startRadius = auraRadius - 5;
                const endRadius = auraRadius + 8;
                ctx.beginPath();
                ctx.moveTo(centerX + Math.cos(angle) * startRadius, centerY + Math.sin(angle) * startRadius);
                ctx.lineTo(centerX + Math.cos(angle) * endRadius, centerY + Math.sin(angle) * endRadius);
                ctx.stroke();
            }
        }
        if (this.bouncy) {
            // Aura rosa claro pulsante (Bouncy)
            const bouncePulse = 0.25 + Math.sin(Date.now() / 150) * 0.15;
            ctx.fillStyle = `rgba(255, 105, 180, ${bouncePulse})`;
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (this.timeWarp) {
            // Aura roxa média com efeito de distorção temporal
            const timeEffect = Date.now() / 100;
            ctx.fillStyle = 'rgba(147, 112, 219, 0.4)';
            ctx.shadowColor = '#9370db';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, auraRadius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Anéis de tempo girando (circulares)
            for (let i = 0; i < 2; i++) {
                ctx.strokeStyle = `rgba(147, 112, 219, ${0.5 - i * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const radius = auraRadius + i * 8 + Math.sin(timeEffect + i) * 3;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Desenhar pernas animadas (antes do corpo para ficarem atrás)
        this.drawLegs(ctx, screenX, finalScreenY);

        // Desenhar antena (se não tiver chapéus) - ANTES do corpo
        if (this.hatCount === 0) {
            this.drawAntenna(ctx, screenX, finalScreenY);
        }

        // Corpo do jogador em formato BLOB (arredondado)
        this.drawBlobBody(ctx, screenX, finalScreenY);

        // ============================================
        // OLHOS COM EXPRESSÕES DINÂMICAS
        // ============================================
        this.drawEyes(ctx, screenX, finalScreenY);

        // ============================================
        // BOCA COM EXPRESSÕES DINÂMICAS
        // ============================================
        this.drawMouth(ctx, screenX, finalScreenY);

        // ============================================
        // ELEMENTOS EXTRAS BASEADOS EM EXPRESSÃO
        // ============================================
        this.drawExpressionExtras(ctx, screenX, finalScreenY);

        // Desenhar chapéus POR CIMA de tudo (empilhados)
        if (this.hatCount > 0) {
            this.drawHats(ctx, screenX, finalScreenY);
        }

        // Restaurar contexto (sempre restaurar ao final)
        ctx.restore();
    }

    drawEyes(ctx, screenX, screenY) {
        const eyeLeftX = screenX + 7;
        const eyeRightX = screenX + 17;
        const eyeY = screenY + 10;
        let eyeSize = 4;
        let eyeWidthMultiplier = 1;
        let eyeHeightMultiplier = 1;

        // ANIMAÇÃO DE PISCAR (squash vertical dos olhos)
        const blinkProgress = this.isBlinking ? Math.min(this.blinkDuration / 4, 1) : 0;
        const eyeSquash = 1 - blinkProgress * 0.9; // Olhos fecham 90%

        // Modificar formato baseado em expressão
        switch (this.expression) {
            case 'scared':
                // Olhos mais largos e arredondados
                eyeSize = 5;
                eyeWidthMultiplier = 1.2;
                eyeHeightMultiplier = 1.3;
                break;

            case 'excited':
                // Olhos brilhantes normais
                eyeSize = 4.5;
                eyeWidthMultiplier = 1.1;
                eyeHeightMultiplier = 1.1;
                break;

            case 'dizzy':
                // Olhos em espiral/X - renderizar diferente
                this.drawDizzyEyes(ctx, eyeLeftX, eyeRightX, eyeY);
                return;

            case 'angry':
                // Olhos estreitos (mais horizontais)
                eyeSize = 4;
                eyeWidthMultiplier = 1.2;
                eyeHeightMultiplier = 0.6;
                break;

            case 'determined':
                // Olhos semi-fechados focados
                eyeSize = 4;
                eyeWidthMultiplier = 1;
                eyeHeightMultiplier = 0.7;
                break;

            default: // normal
                eyeSize = 4;
                eyeWidthMultiplier = 1;
                eyeHeightMultiplier = 1;
        }

        // Aplicar squash de piscar
        eyeHeightMultiplier *= eyeSquash;

        // Outline preto dos olhos
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(eyeLeftX, eyeY, (eyeSize + 1) * eyeWidthMultiplier, (eyeSize + 1) * eyeHeightMultiplier, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeRightX, eyeY, (eyeSize + 1) * eyeWidthMultiplier, (eyeSize + 1) * eyeHeightMultiplier, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brancos dos olhos - só desenhar se não estiver completamente fechado
        if (eyeHeightMultiplier > 0.1) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(eyeLeftX, eyeY, eyeSize * eyeWidthMultiplier, eyeSize * eyeHeightMultiplier, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(eyeRightX, eyeY, eyeSize * eyeWidthMultiplier, eyeSize * eyeHeightMultiplier, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pupilas - só se não piscando
        if (eyeHeightMultiplier > 0.3) {
            this.drawPupils(ctx, eyeLeftX, eyeRightX, eyeY, eyeWidthMultiplier, eyeHeightMultiplier);
        }
    }

    drawDizzyEyes(ctx, eyeLeftX, eyeRightX, eyeY) {
        // Olhos em X (dizzy/confuso)
        const size = 5;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;

        // Olho esquerdo - X
        ctx.beginPath();
        ctx.moveTo(eyeLeftX - size/2, eyeY - size/2);
        ctx.lineTo(eyeLeftX + size/2, eyeY + size/2);
        ctx.moveTo(eyeLeftX + size/2, eyeY - size/2);
        ctx.lineTo(eyeLeftX - size/2, eyeY + size/2);
        ctx.stroke();

        // Olho direito - X
        ctx.beginPath();
        ctx.moveTo(eyeRightX - size/2, eyeY - size/2);
        ctx.lineTo(eyeRightX + size/2, eyeY + size/2);
        ctx.moveTo(eyeRightX + size/2, eyeY - size/2);
        ctx.lineTo(eyeRightX - size/2, eyeY + size/2);
        ctx.stroke();
    }

    drawPupils(ctx, eyeLeftX, eyeRightX, eyeY, widthMult, heightMult) {
        ctx.fillStyle = '#000000';
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        let pupilSize = 2.5;

        // Modificar pupilas baseado em expressão
        switch (this.expression) {
            case 'scared':
                // Pupilas pequenas olhando para baixo
                pupilSize = 1.5;
                pupilOffsetY = 1.5;
                break;

            case 'excited':
                // Pupilas grandes e brilhantes
                pupilSize = 3;
                if (Math.abs(this.vx) > 0.5) {
                    pupilOffsetX = this.facingRight ? 1.5 : -1.5;
                }
                break;

            case 'angry':
                // Pupilas menores e centradas (olhar fixo)
                pupilSize = 2;
                break;

            case 'determined':
                // Pupilas focadas na direção do movimento
                pupilSize = 2.5;
                if (Math.abs(this.vx) > 0.5) {
                    pupilOffsetX = this.facingRight ? 1 : -1;
                }
                break;

            default: // normal
                pupilSize = 2.5;
                if (Math.abs(this.vx) > 0.5) {
                    pupilOffsetX = this.facingRight ? 1.5 : -1.5;
                }
                // Pupilas olham pra baixo quando caindo
                if (!this.grounded && this.vy > 3) {
                    pupilOffsetY = 1.5;
                }
                // Olham pra cima quando pulando
                else if (!this.grounded && this.vy < -2) {
                    pupilOffsetY = -1;
                }
        }

        // Desenhar pupilas
        ctx.beginPath();
        ctx.arc(eyeLeftX + pupilOffsetX, eyeY + pupilOffsetY, pupilSize * heightMult, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeRightX + pupilOffsetX, eyeY + pupilOffsetY, pupilSize * heightMult, 0, Math.PI * 2);
        ctx.fill();

        // Brilho nos olhos (exceto angry)
        if (this.expression !== 'angry') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(eyeLeftX - 1, eyeY - 1, 1.2 * heightMult, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeRightX - 1, eyeY - 1, 1.2 * heightMult, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMouth(ctx, screenX, screenY) {
        const mouthX = screenX + 12;
        const mouthY = screenY + 19;

        switch (this.expression) {
            case 'scared':
                // Boca oval grande (O surpreso)
                const scaredSize = 1.5;
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(mouthX, mouthY, 3 * scaredSize, 4 * scaredSize, 0, 0, Math.PI * 2);
                ctx.fill();

                // Interior da boca
                ctx.fillStyle = '#330000';
                ctx.beginPath();
                ctx.ellipse(mouthX, mouthY, 2 * scaredSize, 3 * scaredSize, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'excited':
                // Sorriso largo com língua de fora
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(mouthX, screenY + 17, 5, 0.2, Math.PI - 0.2);
                ctx.stroke();

                // Língua (pequena)
                ctx.fillStyle = '#ff6b9d';
                ctx.beginPath();
                ctx.ellipse(mouthX, screenY + 20, 2, 3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Outline da língua
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(mouthX, screenY + 20, 2, 3, 0, Math.PI, Math.PI * 2);
                ctx.stroke();
                break;

            case 'dizzy':
                // Boca ondulada (~)
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(mouthX - 4, mouthY - 1);
                ctx.quadraticCurveTo(mouthX - 2, mouthY + 1, mouthX, mouthY - 1);
                ctx.quadraticCurveTo(mouthX + 2, mouthY - 3, mouthX + 4, mouthY - 1);
                ctx.stroke();
                break;

            case 'angry':
                // Linha reta horizontal (boca fechada com raiva)
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(mouthX - 4, screenY + 18);
                ctx.lineTo(mouthX + 4, screenY + 18);
                ctx.stroke();
                break;

            case 'determined':
                // Sorriso pequeno confiante
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(mouthX, screenY + 17, 3, 0.3, Math.PI - 0.3);
                ctx.stroke();
                break;

            default: // normal
                // Boca padrão (muda com velocidade vertical)
                if (!this.grounded || Math.abs(this.vy) > 0.5) {
                    // Boca aberta (surpreso)
                    const mouthOpenness = 1 + Math.min(Math.abs(this.vy) / 15, 0.3);
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.ellipse(mouthX, mouthY, 3 * mouthOpenness, 3.5 * mouthOpenness, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Interior da boca
                    ctx.fillStyle = '#330000';
                    ctx.beginPath();
                    ctx.ellipse(mouthX, mouthY, 2 * mouthOpenness, 2.5 * mouthOpenness, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Sorriso simples
                    const smileSize = 3.5 + Math.abs(this.vx) * 0.2;
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(mouthX, screenY + 17, smileSize, 0.3, Math.PI - 0.3);
                    ctx.stroke();
                }
        }
    }

    drawExpressionExtras(ctx, screenX, screenY) {
        // Gotas de suor para scared e dizzy
        if (this.expression === 'scared' || this.expression === 'dizzy') {
            const sweatX = screenX + this.width + 2;
            const sweatY = screenY + 8;
            const sweatTime = Date.now() / 300;
            const sweatOffset = Math.sin(sweatTime) * 2;

            // Gota 1
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(sweatX, sweatY + sweatOffset, 2.5, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#6bb6ff';
            ctx.beginPath();
            ctx.ellipse(sweatX, sweatY + sweatOffset, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Brilho na gota
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(sweatX - 0.5, sweatY + sweatOffset - 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Partículas de raiva para angry
        if (this.expression === 'angry') {
            const time = Date.now() / 100;
            const headCenterX = screenX + this.width / 2;
            const headY = screenY + 5;

            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            // 3 linhas de raiva pulsantes
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                const pulse = Math.sin(time + i) * 0.5 + 0.5;
                const startDist = 8;
                const endDist = 11 + pulse * 2;

                const startX = headCenterX + Math.cos(angle) * startDist;
                const startY = headY + Math.sin(angle) * startDist;
                const endX = headCenterX + Math.cos(angle) * endDist;
                const endY = headY + Math.sin(angle) * endDist;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }

    drawBlobBody(ctx, screenX, screenY) {
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        const radiusX = this.width / 2;
        const radiusY = this.height / 2;

        // OUTLINE PRETO (estilo cartoon)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX + 2, radiusY + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // SOMBRA INTERNA (lado inferior/direito) - gradiente mais suave
        const shadowGradient = ctx.createRadialGradient(
            centerX - radiusX * 0.4,
            centerY - radiusY * 0.4,
            0,
            centerX,
            centerY,
            radiusX * 1.2
        );
        shadowGradient.addColorStop(0, this.colorLight);
        shadowGradient.addColorStop(0.5, this.color);
        shadowGradient.addColorStop(1, this.colorDark);

        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // HIGHLIGHT GRANDE (brilho no topo) - estilo cartoon fofo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(centerX - radiusX * 0.2, centerY - radiusY * 0.35, radiusX * 0.5, radiusY * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mini highlight secundário
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX + radiusX * 0.3, centerY - radiusY * 0.2, radiusX * 0.2, radiusY * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHats(ctx, screenX, screenY) {
        // Desenhar múltiplos chapéus empilhados
        const hatCenterX = screenX + this.width / 2;
        const hatSpacing = 7; // Espaçamento vertical entre chapéus
        const startY = screenY - 8; // Posição do primeiro chapéu (base)

        // Desenhar cada chapéu da pilha (do mais recente ao mais antigo)
        // Invertido: último coletado fica na base, primeiro fica no topo
        for (let i = 0; i < this.hatCount; i++) {
            const hatBaseY = startY - (i * hatSpacing);
            // Pegar o tipo do chapéu INVERTIDO (último coletado = base)
            const hatIndex = this.hatCount - 1 - i;
            const hatType = this.hatTypes[hatIndex] || 'plains';
            this.drawSingleHat(ctx, hatCenterX, hatBaseY, hatType);
        }
    }

    drawSingleHat(ctx, hatCenterX, hatBaseY, hatType = 'plains') {
        // Desenhar baseado no tipo de chapéu
        switch (hatType.toLowerCase()) {
            case 'plains':
                this.drawCowboyHat(ctx, hatCenterX, hatBaseY);
                break;
            case 'cave':
                this.drawMinerHelmet(ctx, hatCenterX, hatBaseY);
                break;
            case 'ice':
                this.drawFurHat(ctx, hatCenterX, hatBaseY);
                break;
            case 'desert':
                this.drawTurban(ctx, hatCenterX, hatBaseY);
                break;
            case 'sky':
                this.drawPilotCap(ctx, hatCenterX, hatBaseY);
                break;
            case 'apocalypse':
                this.drawCombatHelmet(ctx, hatCenterX, hatBaseY);
                break;
            case 'moon':
                this.drawAstronautHelmet(ctx, hatCenterX, hatBaseY);
                break;
            case 'black_hole':
                this.drawVoidCrown(ctx, hatCenterX, hatBaseY);
                break;
            default:
                this.drawCowboyHat(ctx, hatCenterX, hatBaseY);
        }
    }

    // ============================================
    // FUNÇÕES DE DESENHO DOS DIFERENTES CHAPÉUS
    // ============================================

    drawCowboyHat(ctx, hatCenterX, hatBaseY) {
        const hatColor = '#8B4513';
        const hatDark = '#654321';
        const bandColor = '#DAA520';

        // OUTLINE PRETO da aba
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 13, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aba do chapéu
        ctx.fillStyle = hatColor;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 13, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // OUTLINE PRETO da copa
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 7, hatBaseY - 3, 14, 16);

        // Copa do chapéu
        ctx.fillStyle = hatColor;
        ctx.fillRect(hatCenterX - 6, hatBaseY - 2, 12, 14);

        // OUTLINE PRETO do topo
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY - 2, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Topo do chapéu
        ctx.fillStyle = hatColor;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY - 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Faixa decorativa
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 7, hatBaseY + 8, 14, 4);
        ctx.fillStyle = bandColor;
        ctx.fillRect(hatCenterX - 6, hatBaseY + 9, 12, 3);
    }

    drawMinerHelmet(ctx, hatCenterX, hatBaseY) {
        const main = '#2C3E50';
        const accent = '#F1C40F';
        const light = '#FFF8DC';

        // Outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 8, hatBaseY + 1, 16, 14);

        // Capacete
        ctx.fillStyle = main;
        ctx.fillRect(hatCenterX - 7, hatBaseY + 2, 14, 12);

        // Topo arredondado outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 2, 8, 3, 0, 0, Math.PI, true);
        ctx.fill();

        // Topo arredondado
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 2, 7, 2, 0, 0, Math.PI, true);
        ctx.fill();

        // Lanterna frontal
        ctx.fillStyle = accent;
        ctx.fillRect(hatCenterX - 3, hatBaseY + 5, 4, 5);
        ctx.fillStyle = light;
        ctx.fillRect(hatCenterX - 2, hatBaseY + 6, 2, 3);

        // Brilho da lanterna
        ctx.shadowColor = light;
        ctx.shadowBlur = 5;
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(hatCenterX - 1, hatBaseY + 7, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawFurHat(ctx, hatCenterX, hatBaseY) {
        const main = '#F8F8FF';
        const accent = '#87CEEB';
        const fur = '#FFFACD';

        // Outline base
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 11, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 11, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline copa
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 7, hatBaseY, 14, 12);

        // Copa
        ctx.fillStyle = main;
        ctx.fillRect(hatCenterX - 6, hatBaseY + 1, 12, 10);

        // Pelo na borda
        ctx.fillStyle = fur;
        for (let i = 0; i < 10; i++) {
            const x = hatCenterX - 6 + i * 1.2;
            ctx.fillRect(x, hatBaseY + 9, 1, 2);
        }

        // Faixa azul
        ctx.fillStyle = accent;
        ctx.fillRect(hatCenterX - 6, hatBaseY + 7, 12, 2);
    }

    drawTurban(ctx, hatCenterX, hatBaseY) {
        const main = '#F4A460';
        const band = '#D2691E';
        const accent = '#FFD700';

        // Camadas do turbante (de baixo para cima)
        for (let i = 0; i < 3; i++) {
            // Outline
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(hatCenterX, hatBaseY + 11 - i * 2, 11 - i, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Camada
            ctx.fillStyle = main;
            ctx.beginPath();
            ctx.ellipse(hatCenterX, hatBaseY + 11 - i * 2, 10 - i, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nó decorativo
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX + 4, hatBaseY + 6, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = band;
        ctx.beginPath();
        ctx.ellipse(hatCenterX + 4, hatBaseY + 6, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Detalhe dourado
        ctx.fillStyle = accent;
        ctx.fillRect(hatCenterX - 2, hatBaseY + 7, 4, 2);
    }

    drawPilotCap(ctx, hatCenterX, hatBaseY) {
        const main = '#4682B4';
        const accent = '#FFFFFF';
        const goggles = '#000000';

        // Outline base
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 11, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base (pala)
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 11, 11, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline copa
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 6, hatBaseY + 2, 12, 10);

        // Copa
        ctx.fillStyle = main;
        ctx.fillRect(hatCenterX - 5, hatBaseY + 3, 10, 8);

        // Óculos de aviador
        ctx.fillStyle = goggles;
        ctx.beginPath();
        ctx.ellipse(hatCenterX - 2, hatBaseY + 5, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hatCenterX + 2, hatBaseY + 5, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ponte dos óculos
        ctx.fillRect(hatCenterX - 1, hatBaseY + 4, 2, 1);
    }

    drawCombatHelmet(ctx, hatCenterX, hatBaseY) {
        const main = '#2F2F2F';
        const accent = '#8B0000';
        const camo = '#696969';

        // Outline capacete
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 8, hatBaseY + 1, 16, 13);

        // Capacete
        ctx.fillStyle = main;
        ctx.fillRect(hatCenterX - 7, hatBaseY + 2, 14, 11);

        // Topo arredondado outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 2, 8, 3, 0, 0, Math.PI, true);
        ctx.fill();

        // Topo arredondado
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 2, 7, 2, 0, 0, Math.PI, true);
        ctx.fill();

        // Padrão de camuflagem
        ctx.fillStyle = camo;
        ctx.fillRect(hatCenterX - 5, hatBaseY + 4, 2, 2);
        ctx.fillRect(hatCenterX, hatBaseY + 6, 2, 2);
        ctx.fillRect(hatCenterX + 3, hatBaseY + 5, 2, 2);

        // Detalhes vermelhos
        ctx.fillStyle = accent;
        ctx.fillRect(hatCenterX - 6, hatBaseY + 3, 12, 1);
        ctx.fillRect(hatCenterX - 6, hatBaseY + 11, 12, 1);
    }

    drawAstronautHelmet(ctx, hatCenterX, hatBaseY) {
        const main = '#C0C0C0';
        const visor = '#87CEEB';

        // Outline capacete
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 8, hatBaseY + 1, 16, 13);

        // Capacete
        ctx.fillStyle = main;
        ctx.fillRect(hatCenterX - 7, hatBaseY + 2, 14, 11);

        // Topo arredondado outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 2, 8, 3, 0, 0, Math.PI, true);
        ctx.fill();

        // Topo arredondado
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.ellipse(hatCenterX, hatBaseY + 2, 7, 2, 0, 0, Math.PI, true);
        ctx.fill();

        // Visor azul
        ctx.fillStyle = visor;
        ctx.fillRect(hatCenterX - 5, hatBaseY + 4, 10, 7);

        // Reflexo no visor
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(hatCenterX - 3, hatBaseY + 5, 2, 1);
        ctx.fillRect(hatCenterX + 1, hatBaseY + 7, 1, 2);
    }

    drawVoidCrown(ctx, hatCenterX, hatBaseY) {
        const main = '#0D0D0D';
        const band = '#1A0F2E';
        const accent = '#FF6B35';
        const energy = '#8A2BE2';

        // Pontas da coroa (5 pontas)
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 5; i++) {
            const x = hatCenterX - 7 + i * 3.5;
            ctx.beginPath();
            ctx.moveTo(x, hatBaseY + 11);
            ctx.lineTo(x + 1.5, hatBaseY + 4);
            ctx.lineTo(x + 3, hatBaseY + 11);
            ctx.closePath();
            ctx.fill();
        }

        // Pontas coloridas
        ctx.fillStyle = main;
        for (let i = 0; i < 5; i++) {
            const x = hatCenterX - 7 + i * 3.5;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, hatBaseY + 11);
            ctx.lineTo(x + 1.5, hatBaseY + 5);
            ctx.lineTo(x + 2.5, hatBaseY + 11);
            ctx.closePath();
            ctx.fill();
        }

        // Base da coroa
        ctx.fillStyle = '#000000';
        ctx.fillRect(hatCenterX - 7, hatBaseY + 9, 14, 4);

        ctx.fillStyle = band;
        ctx.fillRect(hatCenterX - 6, hatBaseY + 10, 12, 2);

        // Energia pulsante
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.5 + 0.5;

        ctx.shadowColor = energy;
        ctx.shadowBlur = 4 * pulse;
        ctx.fillStyle = energy;

        // Pequenos orbes de energia
        for (let i = 0; i < 3; i++) {
            const angle = time * 2 + (i * Math.PI * 2 / 3);
            const x = hatCenterX + Math.cos(angle) * 6;
            const y = hatBaseY + 7 + Math.sin(angle) * 1;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    spawnBhopDust(points) {
        // Partículas baseadas na precisão do timing
        if (window.createParticles) {
            // Spawnar nos pés (base do personagem)
            const footY = this.y + this.height;
            const footLeftX = this.x + 6;
            const footRightX = this.x + this.width - 6;

            // Quantidade de partículas baseada nos pontos
            let particleCount = 0;
            if (points === 100) particleCount = 10;      // Frame 3 (perfeito)
            else if (points === 75) particleCount = 7;   // Frame 2/4 (bom)
            else if (points === 50) particleCount = 4;   // Frame 1/5 (ok)

            // Cor baseada no combo (3º pulo tem partículas especiais)
            let isSuper = this.bhopCombo === 3;

            for (let i = 0; i < particleCount; i++) {
                // Alternar entre pé esquerdo e direito
                const footX = i % 2 === 0 ? footLeftX : footRightX;

                game.particles.push({
                    x: footX + (Math.random() - 0.5) * 10,
                    y: footY + (Math.random() - 0.5) * 3,
                    vx: (Math.random() - 0.5) * 5,
                    vy: Math.random() * -4 - 2,
                    life: 25 + Math.random() * 15,
                    maxLife: 40,
                    size: 4 + Math.random() * 3,
                    isSuper: isSuper,
                    superScore: isSuper ? this.bhopScore : 0,
                    update() {
                        this.x += this.vx * game.deltaTimeFactor;
                        this.y += this.vy * game.deltaTimeFactor;
                        this.vy += 0.25 * game.deltaTimeFactor;
                        this.vx *= Math.pow(0.96, game.deltaTimeFactor);
                        this.life -= game.deltaTimeFactor;
                    },
                    draw(ctx) {
                        const screenX = this.x - game.camera.x;
                        const screenY = this.y - game.camera.y;
                        const alpha = Math.min((this.life / this.maxLife) * 1.2, 0.9);

                        let fillColor, strokeColor;

                        if (this.isSuper) {
                            // Partículas especiais para o 3º pulo
                            if (this.superScore >= 200) {
                                // Dourado (score perfeito = 3x 100pts = 300pts, ajustado para 200pts)
                                fillColor = `rgba(255, 215, 0, ${alpha})`;
                                strokeColor = `rgba(218, 165, 32, ${alpha * 0.8})`;
                            } else if (this.superScore >= 150) {
                                // Laranja (score médio)
                                fillColor = `rgba(255, 140, 0, ${alpha})`;
                                strokeColor = `rgba(255, 100, 0, ${alpha * 0.8})`;
                            } else {
                                // Marrom (score baixo)
                                fillColor = `rgba(139, 90, 43, ${alpha})`;
                                strokeColor = `rgba(101, 67, 33, ${alpha * 0.7})`;
                            }
                        } else {
                            // Partículas normais (marrom)
                            fillColor = `rgba(139, 90, 43, ${alpha})`;
                            strokeColor = `rgba(101, 67, 33, ${alpha * 0.7})`;
                        }

                        ctx.fillStyle = fillColor;
                        ctx.strokeStyle = strokeColor;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                });
            }
        }
    }

    drawAntenna(ctx, screenX, screenY) {
        // Posição base da antena (topo da cabeça, centro)
        const baseX = screenX + this.width / 2;
        const baseY = screenY;

        // Calcular posição final da antena usando ângulo
        const antennaEndX = baseX + Math.sin(this.antennaAngle) * this.antennaLength;
        const antennaEndY = baseY - Math.cos(this.antennaAngle) * this.antennaLength;

        // Desenhar outline preto da haste da antena
        ctx.lineWidth = this.antennaWidth + 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(antennaEndX, antennaEndY);
        ctx.stroke();

        // Desenhar haste da antena
        ctx.lineWidth = this.antennaWidth;
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.colorDark;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(antennaEndX, antennaEndY);
        ctx.stroke();

        // Outline preto da bolinha na ponta da antena
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(antennaEndX, antennaEndY, this.antennaWidth * 1.5 + 2, 0, Math.PI * 2);
        ctx.fill();

        // Bolinha na ponta da antena
        ctx.fillStyle = this.colorDark;
        ctx.beginPath();
        ctx.arc(antennaEndX, antennaEndY, this.antennaWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Brilho na bolinha
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(antennaEndX - 1, antennaEndY - 1, this.antennaWidth * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLegs(ctx, screenX, screenY) {
        // Parâmetros das pernas (mais grossinhas e fofas)
        const legWidth = 6;
        const bodyBottom = screenY + this.height;
        const leftLegX = screenX + 6;
        const rightLegX = screenX + 12;

        // Se estiver no ar, pernas juntas e ARREDONDADAS
        if (!this.grounded) {
            // Outline preto das pernas (arredondado)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.roundRect(leftLegX - 2, bodyBottom, legWidth + 4, 7, 3);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(rightLegX - 2, bodyBottom, legWidth + 4, 7, 3);
            ctx.fill();

            // Pernas coloridas (arredondadas)
            ctx.fillStyle = this.colorDark;
            ctx.beginPath();
            ctx.roundRect(leftLegX, bodyBottom, legWidth, 5, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(rightLegX, bodyBottom, legWidth, 5, 2);
            ctx.fill();

            // Pezinhos ARREDONDADOS
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(leftLegX + legWidth/2, bodyBottom + 6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightLegX + legWidth/2, bodyBottom + 6, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.colorDark;
            ctx.beginPath();
            ctx.arc(leftLegX + legWidth/2, bodyBottom + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightLegX + legWidth/2, bodyBottom + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // Animação de caminhada - 4 frames (movimento mais exagerado)
        let leftLegHeight = 5;
        let rightLegHeight = 5;

        switch(this.animFrame) {
            case 0:
                leftLegHeight = 5;
                rightLegHeight = 5;
                break;
            case 1:
                leftLegHeight = 3;
                rightLegHeight = 7;
                break;
            case 2:
                leftLegHeight = 5;
                rightLegHeight = 5;
                break;
            case 3:
                leftLegHeight = 7;
                rightLegHeight = 3;
                break;
        }

        // Outline preto das pernas (arredondado)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(leftLegX - 2, bodyBottom, legWidth + 4, leftLegHeight + 1, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(rightLegX - 2, bodyBottom, legWidth + 4, rightLegHeight + 1, 3);
        ctx.fill();

        // Pernas coloridas (arredondadas)
        ctx.fillStyle = this.colorDark;
        ctx.beginPath();
        ctx.roundRect(leftLegX, bodyBottom, legWidth, leftLegHeight, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(rightLegX, bodyBottom, legWidth, rightLegHeight, 2);
        ctx.fill();

        // Pezinhos REDONDOS E FOFOS
        const leftFootY = bodyBottom + leftLegHeight;
        const rightFootY = bodyBottom + rightLegHeight;

        // Outline dos pezinhos
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(leftLegX + legWidth/2, leftFootY + 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightLegX + legWidth/2, rightFootY + 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pezinhos coloridos
        ctx.fillStyle = this.colorDark;
        ctx.beginPath();
        ctx.arc(leftLegX + legWidth/2, leftFootY + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightLegX + legWidth/2, rightFootY + 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    getModifierTimeRemaining(type) {
        if (type === 'jump') {
            return Math.ceil(this.jumpBoostTime / 60);
        } else if (type === 'speed') {
            return Math.ceil(this.speedBoostTime / 60);
        } else if (type === 'shield') {
            return Math.ceil(this.shieldTime / 60);
        } else if (type === 'reverse') {
            return Math.ceil(this.reverseControlsTime / 60);
        } else if (type === 'ice') {
            return Math.ceil(this.icyFloorTime / 60);
        } else if (type === 'doublejump') {
            return Math.ceil(this.doubleJumpTime / 60);
        } else if (type === 'magnet') {
            return Math.ceil(this.magnetTime / 60);
        } else if (type === 'tiny') {
            return Math.ceil(this.tinyPlayerTime / 60);
        } else if (type === 'heavy') {
            return Math.ceil(this.heavyTime / 60);
        } else if (type === 'bouncy') {
            return Math.ceil(this.bouncyTime / 60);
        } else if (type === 'timewarp') {
            return Math.ceil(this.timeWarpTime / 60);
        }
        return 0;
    }

    getModifierProgress(type) {
        if (type === 'jump' && this.jumpBoostMaxTime > 0) {
            return this.jumpBoostTime / this.jumpBoostMaxTime;
        } else if (type === 'speed' && this.speedBoostMaxTime > 0) {
            return this.speedBoostTime / this.speedBoostMaxTime;
        } else if (type === 'shield' && this.shieldMaxTime > 0) {
            return this.shieldTime / this.shieldMaxTime;
        } else if (type === 'reverse' && this.reverseControlsMaxTime > 0) {
            return this.reverseControlsTime / this.reverseControlsMaxTime;
        } else if (type === 'ice' && this.icyFloorMaxTime > 0) {
            return this.icyFloorTime / this.icyFloorMaxTime;
        } else if (type === 'doublejump' && this.doubleJumpMaxTime > 0) {
            return this.doubleJumpTime / this.doubleJumpMaxTime;
        } else if (type === 'magnet' && this.magnetMaxTime > 0) {
            return this.magnetTime / this.magnetMaxTime;
        } else if (type === 'tiny' && this.tinyPlayerMaxTime > 0) {
            return this.tinyPlayerTime / this.tinyPlayerMaxTime;
        } else if (type === 'heavy' && this.heavyMaxTime > 0) {
            return this.heavyTime / this.heavyMaxTime;
        } else if (type === 'bouncy' && this.bouncyMaxTime > 0) {
            return this.bouncyTime / this.bouncyMaxTime;
        } else if (type === 'timewarp' && this.timeWarpMaxTime > 0) {
            return this.timeWarpTime / this.timeWarpMaxTime;
        }
        return 0;
    }
}
