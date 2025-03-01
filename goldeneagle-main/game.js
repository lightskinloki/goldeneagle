// Main Game Scene
class InfiniteBirdGame extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameScene'
        });
        this.player = null;
        this.speed = 3;
        this.nestPiecesCollected = 0;
        this.requiredNestPieces = 12;
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.lastObstaclePosition = 0;
        this.enemyBirdSpeed = 120; // Speed at which enemy birds chase the player
        // Sound variables
        this.backgroundMusic = null;
        this.collectNestSound = null;
        this.enemyDefeatedSound = null;
        this.gameOverSound = null;
        this.gameWinSound = null;
        this.healSound = null;
        this.hitObstacleSound = null;
        this.buttonClickSound = null;
    }
    
    init() {
        // Reset all gameplay variables when scene starts or restarts
        this.nestPiecesCollected = 0;
        this.health = 100;
        this.score = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.lastObstaclePosition = 0;
    }

    preload() {
        // Load all game assets locally
        this.load.image('playerbird', 'assets/playerbird.png');
        this.load.image('nestPiece', 'assets/nestPiece.png');
        this.load.image('healthbird', 'assets/healthbird.png');
        this.load.image('birdwatcher', 'assets/birdwatcher.png');
        this.load.image('pine', 'assets/pine.png');
        this.load.image('cloud', 'assets/cloud.png');
        this.load.image('background', 'assets/newbackground.png');
        this.load.image('badguy', 'assets/badguy.png');
        
        // Load audio files
        this.load.audio('backgroundMusic', 'assets/audio/background_music.mp3');
        this.load.audio('collectNest', 'assets/audio/collect_nest.mp3');
        this.load.audio('enemyDefeated', 'assets/audio/enemy_defeated.mp3');
        this.load.audio('gameOver', 'assets/audio/game_over.mp3');
        this.load.audio('gameWin', 'assets/audio/game_win.mp3');
        this.load.audio('heal', 'assets/audio/heal.mp3');
        this.load.audio('hitObstacle', 'assets/audio/hit_obstacle.mp3');
        this.load.audio('buttonClick', 'assets/audio/button_click.mp3');
    }

    create() {
        // Reset key gameplay variables for new game or restart
        this.nestPiecesCollected = 0;
        this.health = 100;
        this.score = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.lastObstaclePosition = 0;

        // Initialize audio
        this.setupAudio();

        // Set up the game background
        this.setupBackground();

        // Set up UI elements
        this.setupUI();

        // Create the player (bird of prey)
        this.createPlayer();

        // Create game object groups
        this.createGameObjects();

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Set up collisions
        this.setupCollisions();

        // Set up game over and win conditions
        this.setupGameConditions();

        // Generate initial landscape
        this.generateInitialLandscape();
    }

    setupAudio() {
        // Create all audio objects
        this.backgroundMusic = this.sound.add('backgroundMusic', {
            volume: 0.5,
            loop: true
        });
        this.collectNestSound = this.sound.add('collectNest', { volume: 0.7 });
        this.enemyDefeatedSound = this.sound.add('enemyDefeated', { volume: 0.7 });
        this.gameOverSound = this.sound.add('gameOver', { volume: 0.8 });
        this.gameWinSound = this.sound.add('gameWin', { volume: 0.8 });
        this.healSound = this.sound.add('heal', { volume: 0.7 });
        this.hitObstacleSound = this.sound.add('hitObstacle', { volume: 0.7 });
        this.buttonClickSound = this.sound.add('buttonClick', { volume: 0.6 });
        
        // Start background music
        this.backgroundMusic.play();
    }

    setupBackground() {
        // Create scrolling background sprites
        this.backgrounds = [];

        // Calculate the scale to match the title screen with slight increase
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Create two background instances that fill the screen
        for (let i = 0; i < 2; i++) {
            const bg = this.add.sprite(i * gameWidth - (i * 4), 0, 'background')
                .setOrigin(0, 0)
                .setDisplaySize(gameWidth + 4, gameHeight) // Slightly wider with overlap
                .setDepth(-1); // Ensure background stays behind everything

            this.backgrounds.push(bg);
        }
        // Add decorative distant trees for depth - add more for better coverage
        this.backgroundTrees = this.physics.add.group();
        for (let i = 0; i < 20; i++) { // Increase number of trees for better coverage
            this.createBackgroundTree(
                Phaser.Math.Between(0, 2400),
                0 // Y-position is now handled within createBackgroundTree
            );
        }

        // Add clouds in the background - add more for better coverage
        this.clouds = this.physics.add.group();
        for (let i = 0; i < 12; i++) {
            this.createCloud(
                Phaser.Math.Between(0, 2400),
                Phaser.Math.Between(30, 300) // Cover more vertical space
            );
        }
    }

    setupUI() {
        // Health bar
        this.add.rectangle(20, 20, 204, 24, 0x000000).setOrigin(0, 0);
        this.healthBar = this.add.rectangle(22, 22, 200, 20, 0x00ff00).setOrigin(0, 0);

        // Nest pieces counter
        this.nestCounter = this.add.text(20, 50, 'Nest Pieces: 0/' + this.requiredNestPieces, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setStroke('#000000', 3);

        // Score counter
        this.scoreText = this.add.text(20, 80, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setStroke('#000000', 3);

        // Create game over text (initially hidden)
        this.gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ff0000'
        }).setOrigin(0.5).setVisible(false).setStroke('#000000', 5);

        // Create game win text (initially hidden)
        this.gameWinText = this.add.text(400, 300, 'NEST COMPLETE!\nYOU WIN!', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#00ff00',
            align: 'center'
        }).setOrigin(0.5).setVisible(false).setStroke('#000000', 5);

        // Create restart button (initially hidden)
        this.restartButton = this.add.text(400, 400, 'Restart', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5).setVisible(false).setInteractive();

        this.restartButton.on('pointerdown', () => {
            // Play button click sound
            this.buttonClickSound.play();
            
            // Go to the high score scene instead of just restarting
            this.scene.start('HighscoreScene', {
                lastScore: this.score
            });
        });
    }

    createPlayer() {
        // Create the player (bird of prey) with proper scaling
        const birdTexture = this.textures.get('playerbird');
        const desiredWidth = 80; // Maintain same player size
        const desiredHeight = 60; // Maintain same player size
        const scaleX = desiredWidth / birdTexture.getSourceImage().width;
        const scaleY = desiredHeight / birdTexture.getSourceImage().height;
        this.player = this.physics.add.sprite(200, 300, 'playerbird')
            .setScale(scaleX, scaleY);

        // Ensure the bird is facing the right direction initially
        this.player.flipX = true; // Bird initially faces right

        this.player.setCollideWorldBounds(true);
        this.player.body.setBounce(0.1);

        // Add a breathing animation to make the bird look alive
        this.tweens.add({
            targets: this.player,
            scaleX: scaleX * 1.05,
            scaleY: scaleY * 1.05,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createGameObjects() {
        // Create group for nest pieces
        this.nestPieces = this.physics.add.group();
        // Create group for healthbirds (healing items)
        this.healthbirds = this.physics.add.group();
        // Create group for birdwatchers (enemies)
        this.birdwatchers = this.physics.add.group();
        // Create group for trees (obstacles)
        this.trees = this.physics.add.group();

        // Create group for enemy birds (flying adversaries)
        this.enemyBirds = this.physics.add.group();

        // Add a tip about the new mechanic with clearer instructions
        const tip = this.add.text(400, 30, 'Tip: Defeat hawks from behind (right side) for bonus points and health restoration!', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setStroke('#000000', 3);

        // Make the tip fade out after a few seconds
        this.tweens.add({
            targets: tip,
            alpha: 0,
            delay: 5000,
            duration: 1000,
            onComplete: () => tip.destroy()
        });
    }

    setupCollisions() {
        // Nest piece collection
        this.physics.add.overlap(this.player, this.nestPieces, this.collectNestPiece, null, this);
        // Healthbird collection (healing)
        this.physics.add.overlap(this.player, this.healthbirds, this.collectHealthbird, null, this);
        // Birdwatcher collisions (damage)
        this.physics.add.overlap(this.player, this.birdwatchers, this.hitBirdwatcher, null, this);
        // Tree collisions (damage)
        this.physics.add.overlap(this.player, this.trees, this.hitTree, null, this);

        // Enemy bird collisions (damage)
        this.physics.add.overlap(this.player, this.enemyBirds, this.hitEnemyBird, null, this);
    }

    setupGameConditions() {
        // Game over flag
        this.gameOver = false;

        // Win condition flag
        this.gameWon = false;
    }

    generateInitialLandscape() {
        // Initial generation of trees, obstacles and collectibles
        for (let i = 0; i < 10; i++) {
            this.generateObstacles(800 + i * 300);
        }

        // Add a timer for continuous generation
        this.obstacleTimer = this.time.addEvent({
            delay: 1000,
            callback: this.generateMoreObstacles,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.gameOver || this.gameWon) {
            return;
        }

        // Update the scrolling background
        this.updateBackground();

        // Handle player movement
        this.handlePlayerMovement();

        // Move all game objects
        this.moveGameObjects();

        // Update UI
        this.updateUI();

        // Check win condition
        this.checkWinCondition();

        // Cleanup objects that have moved off-screen
        this.cleanupOffscreenObjects();
    }

    updateBackground() {
        // Move each background sprite
        const gameWidth = this.sys.game.config.width;

        this.backgrounds.forEach((bg) => {
            // Move the background to the left
            bg.x -= this.speed;

            // If the background has moved completely off screen to the left
            if (bg.x <= -gameWidth) {
                // Move it to the right of the other background
                bg.x = Math.max(...this.backgrounds.map(b => b.x)) + gameWidth;
            }
        });
        // Move clouds
        this.clouds.getChildren().forEach(cloud => {
            cloud.x -= this.speed * 0.5; // Clouds move at half speed for parallax
            // Reset cloud position when it moves off screen
            if (cloud.x < -100) {
                cloud.x = 900;
                cloud.y = Phaser.Math.Between(30, 300);
            }
        });

        // Move background trees
        this.backgroundTrees.getChildren().forEach(tree => {
            tree.x -= this.speed * 0.7; // Trees move at 70% speed for parallax
        });
        // Move clouds at varying speeds for parallax effect
        this.clouds.getChildren().forEach(cloud => {
            // Clouds move at different speeds based on their size (smaller ones move faster)
            const parallaxFactor = 0.3 + (0.3 * (1 - cloud.scaleX));
            cloud.x -= this.speed * parallaxFactor;
        });

        // Move background trees slower than foreground for parallax effect
        this.backgroundTrees.getChildren().forEach(tree => {
            tree.x -= this.speed * 0.7; // Move slower than main scene but faster than clouds
        });
    }

    handlePlayerMovement() {
        // Vertical movement
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-200);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(200);
        } else {
            this.player.setVelocityY(0);
        }

        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-150);
            this.player.flipX = false; // Bird faces left when moving left
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(150);
            this.player.flipX = true; // Bird faces right when moving right
        } else {
            this.player.setVelocityX(0);
        }
    }

    moveGameObjects() {
        // Move all game objects to create scrolling effect
        const groups = [this.nestPieces, this.healthbirds, this.birdwatchers, this.trees];
        groups.forEach(group => {
            if (group) { // Check if group exists
                group.getChildren().forEach(obj => {
                    obj.x -= this.speed;
                });
            }
        });
        // Enemy birds move consistently from right to left, but arc toward player
        this.enemyBirds.getChildren().forEach(bird => {
            // Base movement with the scene scrolling
            bird.x -= this.speed;

            // Additional left movement at constant speed
            if (bird.x > -50 && bird.x < 850) {
                const enemyBirdHorizontalSpeed = 2; // Additional speed component

                // Continue moving left - never change this direction
                bird.x -= enemyBirdHorizontalSpeed;

                // Calculate vertical position adjustment to arc toward player
                if (!bird.arcInitialized) {
                    bird.arcInitialized = true;
                    bird.originalY = bird.y;
                    bird.targetPlayer = true;

                    // Store the vertical distance to player for arc calculation
                    bird.playerYDistance = this.player.y - bird.y;

                    // Create smooth arc movement for more natural flight
                    this.tweens.add({
                        targets: bird,
                        y: this.player.y, // Arc toward player's Y position
                        duration: 2000, // Over 2 seconds
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            // After reaching player height, start a random oscillation
                            this.tweens.add({
                                targets: bird,
                                y: bird.y + Phaser.Math.Between(-30, 30),
                                duration: Phaser.Math.Between(1500, 2500),
                                ease: 'Sine.easeInOut',
                                yoyo: true,
                                repeat: -1
                            });
                        }
                    });
                }

                // Keep bird facing left consistently
                bird.flipX = false;

                // Add subtle swooping tilt based on movement
                if (bird.y > bird.originalY) {
                    // Tilting downward when below original height
                    bird.angle = Phaser.Math.Clamp(bird.angle + 0.1, -10, 10);
                } else {
                    // Tilting upward when above original height
                    bird.angle = Phaser.Math.Clamp(bird.angle - 0.1, -10, 10);
                }
            }
        });
    }

    updateUI() {
        // Update health bar width based on current health
        this.healthBar.width = (this.health / this.maxHealth) * 200;

        // Update health bar color based on health level
        if (this.health > 60) {
            this.healthBar.fillColor = 0x00ff00; // Green
        } else if (this.health > 30) {
            this.healthBar.fillColor = 0xffff00; // Yellow
        } else {
            this.healthBar.fillColor = 0xff0000; // Red
        }

        // Update nest counter text
        this.nestCounter.setText('Nest Pieces: ' + this.nestPiecesCollected + '/' + this.requiredNestPieces);

        // Update score text
        this.scoreText.setText('Score: ' + this.score);
    }

    checkWinCondition() {
        // Check if player has collected all required nest pieces
        if (this.nestPiecesCollected >= this.requiredNestPieces && !this.gameWon) {
            this.gameWin();
        }
        // Check if player has lost all health - make sure health can't go below 0
        if (this.health <= 0 && !this.gameOver) {
            this.health = 0; // Ensure health doesn't display negative values
            this.gameDefeat();
        }
    }

    cleanupOffscreenObjects() {
        // Remove objects that have moved off screen
        const groups = [this.nestPieces, this.healthbirds, this.birdwatchers, this.trees, this.clouds, this.enemyBirds, this.backgroundTrees];
        groups.forEach(group => {
            group.getChildren().forEach(obj => {
                if (obj.x < -100) {
                    obj.destroy();
                }
            });
        });
        // Add new clouds if needed - keep a higher minimum
        if (this.clouds.getChildren().length < 12) {
            this.createCloud(
                900,
                Phaser.Math.Between(30, 300)
            );
        }
        // Add new background trees if needed - keep a higher minimum
        if (this.backgroundTrees.getChildren().length < 20) { // Match increased number of trees
            this.createBackgroundTree(
                900, // Position just off-screen
                0 // Y-position is now handled within createBackgroundTree
            );
        }
    }

    createCloud(x, y) {
        // Calculate proper scale for the cloud
        const cloudTexture = this.textures.get('cloud');
        const desiredWidth = Phaser.Math.Between(200, 350); // Larger clouds
        const aspectRatio = cloudTexture.getSourceImage().height / cloudTexture.getSourceImage().width;
        const desiredHeight = desiredWidth * aspectRatio;
        const scaleX = desiredWidth / cloudTexture.getSourceImage().width;
        const scaleY = desiredHeight / cloudTexture.getSourceImage().height;
        const cloud = this.physics.add.sprite(x, y, 'cloud')
            .setScale(scaleX, scaleY)
            .setAlpha(0.8); // Slightly more visible
        // Add slight tint variation for visual interest
        const tintVariations = [0xFFFFFF, 0xEEEEFF, 0xFFEEEE, 0xFFFFEE];
        cloud.setTint(tintVariations[Phaser.Math.Between(0, 3)]);
        this.clouds.add(cloud);
        // Add a subtle floating animation
        this.tweens.add({
            targets: cloud,
            y: y + Phaser.Math.Between(-20, 20),
            duration: Phaser.Math.Between(3000, 6000),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    createBackgroundTree(x, y) {
        // Calculate proper scale for background trees with greater size variation
        const treeTexture = this.textures.get('pine');
        const screenHeight = this.sys.game.config.height;

        // Much greater height variation for background trees
        const desiredHeight = Phaser.Math.Between(100, 350);
        const aspectRatio = treeTexture.getSourceImage().width / treeTexture.getSourceImage().height;
        const desiredWidth = desiredHeight * aspectRatio;
        const scaleX = desiredWidth / treeTexture.getSourceImage().width;
        const scaleY = desiredHeight / treeTexture.getSourceImage().height;

        // Always position from bottom of screen - this ensures trees are grounded
        const bottomY = screenHeight - 10; // Slight offset from very bottom

        const tree = this.physics.add.sprite(x, bottomY, 'pine')
            .setScale(scaleX, scaleY)
            .setOrigin(0.5, 1.0); // Set origin to bottom center for proper grounding

        // Greater transparency variation
        const alpha = Phaser.Math.FloatBetween(0.4, 0.75);
        tree.setAlpha(alpha);

        // Vary the tint for more visual interest - wider range of colors
        const tints = [
            0x779977, // Medium green
            0x668866, // Muted green
            0x557755, // Dark green
            0x889988, // Sage green
            0x446644, // Forest green
            0x335533, // Deep green
            0x88AA88 // Light green
        ];
        tree.setTint(tints[Phaser.Math.Between(0, tints.length - 1)]);

        // Add a depth factor based on tree size and transparency
        // This simulates distance - smaller/more transparent trees appear further away
        const depthValue = alpha * (scaleY * 10);
        tree.setDepth(depthValue);

        this.backgroundTrees.add(tree);
    }

    generateMoreObstacles() {
        // Generate next set of obstacles
        const nextPosition = this.lastObstaclePosition + Phaser.Math.Between(400, 800);
        this.generateObstacles(nextPosition);
        this.lastObstaclePosition = nextPosition;
    }

    generateObstacles(xPosition) {
        // Add trees with appropriate scaling
        const numTrees = Phaser.Math.Between(1, 3);
        for (let i = 0; i < numTrees; i++) {
            const treeTexture = this.textures.get('pine');
            const desiredHeight = Phaser.Math.Between(150, 200);
            const aspectRatio = treeTexture.getSourceImage().width / treeTexture.getSourceImage().height;
            const desiredWidth = desiredHeight * aspectRatio;
            const scaleX = desiredWidth / treeTexture.getSourceImage().width;
            const scaleY = desiredHeight / treeTexture.getSourceImage().height;

            // Add slight size variations
            const scaleVariation = Phaser.Math.FloatBetween(0.9, 1.1);

            const tree = this.physics.add.sprite(
                xPosition + Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(450, 550),
                'pine'
            ).setScale(scaleX * scaleVariation, scaleY * scaleVariation);

            // Add slight color variations to trees
            const tintVariations = [0xFFFFFF, 0xEEFFEE, 0xDDFFDD, 0xFFFFEE];
            tree.setTint(tintVariations[Phaser.Math.Between(0, 3)]);

            this.trees.add(tree);

            // Add subtle swaying animation to trees
            this.tweens.add({
                targets: tree,
                angle: tree.angle + Phaser.Math.FloatBetween(-2, 2),
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        // Add enemy birds (chance-based) with appropriate scaling
        if (Phaser.Math.Between(0, 10) > 7) {
            const badguyTexture = this.textures.get('badguy');
            const desiredWidth = 60; // Slightly smaller than player
            const desiredHeight = 45;
            const scaleX = desiredWidth / badguyTexture.getSourceImage().width;
            const scaleY = desiredHeight / badguyTexture.getSourceImage().height;
            const enemyBird = this.physics.add.sprite(
                    xPosition + Phaser.Math.Between(100, 200), // Start a bit further away
                    Phaser.Math.Between(150, 450),
                    'badguy'
                ).setScale(scaleX, scaleY)
                .setTint(0xFFFFFF);

            // Always face left (consistent direction of flight)
            enemyBird.flipX = false;

            // Add slight tilt to convey flying motion
            enemyBird.angle = Phaser.Math.Between(-5, 5);

            this.enemyBirds.add(enemyBird);
        }

        // Add birdwatchers (chance-based) with appropriate scaling
        if (Phaser.Math.Between(0, 10) > 7) {
            const birdwatcherTexture = this.textures.get('birdwatcher');
            const desiredHeight = 70;
            const aspectRatio = birdwatcherTexture.getSourceImage().width / birdwatcherTexture.getSourceImage().height;
            const desiredWidth = desiredHeight * aspectRatio;
            const scaleX = desiredWidth / birdwatcherTexture.getSourceImage().width;
            const scaleY = desiredHeight / birdwatcherTexture.getSourceImage().height;
            const birdwatcher = this.physics.add.sprite(
                xPosition + Phaser.Math.Between(-50, 50),
                Phaser.Math.Between(350, 500),
                'birdwatcher'
            ).setScale(scaleX, scaleY);
            this.birdwatchers.add(birdwatcher);
        }

        // Create a variable to store tree positions for nest piece placement
        const treePositions = [];

        // Record tree positions for later use with nest pieces
        this.trees.getChildren().forEach(tree => {
            if (Math.abs(tree.x - xPosition) < 150) { // Only consider trees near this spawn point
                treePositions.push({
                    x: tree.x,
                    y: tree.y - (tree.displayHeight / 2) // Top of the tree
                });
            }
        });

        // Add nest pieces (chance-based) with appropriate scaling
        if (Phaser.Math.Between(0, 10) > 7 || treePositions.length === 0) {
            const nestTexture = this.textures.get('nestPiece');
            const desiredWidth = 50;
            const aspectRatio = nestTexture.getSourceImage().height / nestTexture.getSourceImage().width;
            const desiredHeight = desiredWidth * aspectRatio;

            const scaleX = desiredWidth / nestTexture.getSourceImage().width;
            const scaleY = desiredHeight / nestTexture.getSourceImage().height;

            // Place nest piece near a tree if any are available
            let nestX, nestY;

            if (treePositions.length > 0) {
                // Select a random tree from nearby ones
                const selectedTree = treePositions[Phaser.Math.Between(0, treePositions.length - 1)];

                // Position the nest piece near the top of the tree with some variation
                nestX = selectedTree.x + Phaser.Math.Between(-30, 30);
                nestY = selectedTree.y - Phaser.Math.Between(10, 50); // Slightly above the tree
            } else {
                // Fallback to original positioning if no trees are nearby
                nestX = xPosition + Phaser.Math.Between(-50, 50);
                nestY = Phaser.Math.Between(400, 450); // Lower in the screen, not floating high
            }

            const nestPiece = this.physics.add.sprite(nestX, nestY, 'nestPiece')
                .setScale(scaleX, scaleY);

            // Add a subtle floating animation
            this.tweens.add({
                targets: nestPiece,
                y: nestPiece.y - Phaser.Math.Between(5, 10),
                duration: Phaser.Math.Between(1000, 1500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.nestPieces.add(nestPiece);
        }

        // Add healthbirds (chance-based) with appropriate scaling
        if (Phaser.Math.Between(0, 10) > 8) {
            const healthbirdTexture = this.textures.get('healthbird');
            const desiredWidth = 40;
            const aspectRatio = healthbirdTexture.getSourceImage().height / healthbirdTexture.getSourceImage().width;
            const desiredHeight = desiredWidth * aspectRatio;
            const scaleX = desiredWidth / healthbirdTexture.getSourceImage().width;
            const scaleY = desiredHeight / healthbirdTexture.getSourceImage().height;
            const healthbird = this.physics.add.sprite(
                xPosition + Phaser.Math.Between(-50, 50),
                Phaser.Math.Between(200, 400),
                'healthbird'
            ).setScale(scaleX, scaleY);
            // Add movement to healthbirds
            healthbird.yMovement = this.tweens.add({
                targets: healthbird,
                y: healthbird.y + 50,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.healthbirds.add(healthbird);
        }
    }

    collectNestPiece(player, nestPiece) {
        // Play the collect sound
        this.collectNestSound.play();
        
        nestPiece.destroy();
        this.nestPiecesCollected++;
        this.score += 100;

        // Create a visual feedback effect
        this.createCollectEffect(nestPiece.x, nestPiece.y, 0xFFA500);
    }

    collectHealthbird(player, healthbird) {
        // Play the heal sound
        this.healSound.play();
        
        healthbird.destroy();

        // Songbird major healing effect
        const healAmount = 20;
        this.health = Math.min(this.health + healAmount, this.maxHealth);
        this.score += 50;
        // Create a visual feedback effect with amount
        this.createCollectEffect(healthbird.x, healthbird.y, 0x00FF00);
        // Show healing amount
        const healText = this.add.text(healthbird.x, healthbird.y - 30, `+${healAmount} HP`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#00FF00'
        }).setOrigin(0.5).setStroke('#000000', 3);

        // Animate and remove the healing text
        this.tweens.add({
            targets: healText,
            y: healText.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => healText.destroy()
        });
    }

    hitBirdwatcher(player, birdwatcher) {
        // Play hit obstacle sound
        this.hitObstacleSound.play();
        
        birdwatcher.destroy();

        // Damage effect
        this.health -= 15;

        // Visual feedback
        this.cameras.main.shake(200, 0.01);
        this.player.setTint(0xff0000);

        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });
    }

    hitTree(player, tree) {
        // Play hit obstacle sound
        this.hitObstacleSound.play();
        
        // Damage effect
        this.health -= 10;

        // Push player back
        this.player.x -= 30;

        // Visual feedback
        this.cameras.main.shake(100, 0.005);
        this.player.setTint(0xff0000);

        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });
    }
    
    hitEnemyBird(player, enemyBird) {
        // Check if the player is attacking from behind
        const isAttackingFromBehind = this.isAttackingFromBehind(player, enemyBird);

        // Always defeat the enemy bird (regardless of attack angle)
        this.defeatEnemyBird(enemyBird);

        if (isAttackingFromBehind) {
            // Play the enemy defeated sound
            this.enemyDefeatedSound.play();
            
            // Successful ambush attack from behind!
            // Award bonus points for skillful play
            this.score += 200;
            // Restore a small amount of health for a successful ambush
            const healthRestoration = 10; // Small amount (half of what songbirds provide)
            this.health = Math.min(this.health + healthRestoration, this.maxHealth);
            // Create a victory effect with health restoration indication
            this.createDefeatEffect(enemyBird.x, enemyBird.y, `+200 (+${healthRestoration} HP)`, 0xFFFF00);
            // Brief speed boost as reward
            this.player.setVelocityX(this.player.body.velocity.x * 1.5);
            // No damage taken for perfect ambush
            console.log(`Attacked from behind - no damage taken, restored ${healthRestoration} health`);
        } else {
            // Play hit obstacle sound for frontal attack
            this.hitObstacleSound.play();
            
            // Frontal attack - successful but dangerous!
            const damageTaken = 35;

            // Even in frontal attack, restore a tiny bit of health for defeating enemy
            const healthRestoration = 5; // Very small amount

            // Calculate net health change (damage - restoration)
            const netHealthChange = damageTaken - healthRestoration;

            // Apply net health change
            this.health = Math.min(Math.max(0, this.health - netHealthChange), this.maxHealth);

            console.log(`Frontal attack! Damage: ${damageTaken}, Restored: ${healthRestoration}, Net: -${netHealthChange}, Health: ${this.health}`);

            // Push player back 
            this.player.x -= 30;

            // Still award points for defeating enemy, but less
            this.score += 50;

            // Create a different victory effect for frontal attack
            this.createDefeatEffect(enemyBird.x, enemyBird.y, `+50 (-${netHealthChange} HP)`, 0xFF9900);

            // Visual feedback for damage taken
            this.cameras.main.shake(300, 0.025);
            this.player.setTint(0xff0000);

            this.time.delayedCall(350, () => {
                this.player.clearTint();
            });
        }
    }

    isAttackingFromBehind(player, enemyBird) {
        // Check if player is attacking from behind based on:
        // 1. Direction the enemy bird is facing
        // 2. Relative positions of player and enemy
        // Debug info
        console.log(`Enemy bird facing: ${enemyBird.flipX ? 'right' : 'left'}, Player position: ${player.x > enemyBird.x ? 'right' : 'left'} of enemy`);
        // If enemy is facing left (flipX is false), player should be to the RIGHT to be behind it
        if (!enemyBird.flipX && player.x > enemyBird.x) {
            console.log("Behind check 1: true - Enemy facing left, player is behind (to the right)");
            return true;
        }
        // If enemy is facing right (flipX is true), player should be to the LEFT to be behind it
        if (enemyBird.flipX && player.x < enemyBird.x) {
            console.log("Behind check 2: true - Enemy facing right, player is behind (to the left)");
            return true;
        }
        console.log("Not attacking from behind - frontal collision");
        return false;
    }

    defeatEnemyBird(enemyBird) {
        // Add a brief "defeated" animation before destroying
        this.tweens.add({
            targets: enemyBird,
            angle: 180,
            scale: 0.7,
            alpha: 0.7,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                enemyBird.destroy();
            }
        });
    }

    createDefeatEffect(x, y, pointsText, color) {
        // Create a victorious flash effect
        const flash = this.add.circle(x, y, 60, color, 0.7);
        // Add some text showing the points awarded (and damage if applicable)
        const pointsDisplay = this.add.text(x, y - 30, pointsText, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff' // Changed to white for better visibility
        }).setOrigin(0.5).setStroke('#000000', 3);

        // Animate the flash and text
        this.tweens.add({
            targets: [flash, pointsDisplay],
            scale: 1.5,
            alpha: 0,
            y: '-=50',
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
                pointsDisplay.destroy();
            }
        });

        // Create particles without using the badguy sprite
        const particles = this.add.particles(x, y, {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.05, end: 0 },
            lifespan: { min: 500, max: 700 },
            quantity: 15,
            tint: color
        });

        // Auto-destroy the particles after animation completes
        this.time.delayedCall(700, () => {
            particles.destroy();
        });
    }
    
    createCollectEffect(x, y, color) {
        // Create a simpler particle effect without using sprites
        const particles = this.add.particles(x, y, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.1, end: 0 },
            lifespan: { min: 400, max: 600 },
            quantity: 20,
            tint: color
        });

        // Add a flash effect
        const flash = this.add.circle(x, y, 40, color, 0.7);
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
        
        // Auto-destroy the particles after animation completes
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }

    gameDefeat() {
        // Stop background music and play game over sound
        this.backgroundMusic.stop();
        this.gameOverSound.play();
        
        this.gameOver = true;
        // Stop all movement
        this.physics.pause();
        this.obstacleTimer.remove();
        // Show game over text and restart button
        this.gameOverText.setVisible(true);
        this.restartButton.setVisible(true);
        // Red tint effect
        this.player.setTint(0xff0000);

        // Save the high score
        this.saveHighScore();
    }

    gameWin() {
        // Stop background music and play win sound
        this.backgroundMusic.stop();
        this.gameWinSound.play();
        
        this.gameWon = true;
        // Stop all movement
        this.physics.pause();
        this.obstacleTimer.remove();
        // Show win text and restart button
        this.gameWinText.setVisible(true);
        this.restartButton.setVisible(true);
        // Gold tint effect
        this.player.setTint(0xFFD700);

        // Save the high score
        this.saveHighScore();
    }
    
    saveHighScore() {
        // Get current high scores from local storage
        let highScores = JSON.parse(localStorage.getItem('birdGameHighScores')) || [];

        // Add current score
        highScores.push({
            score: this.score,
            date: new Date().toLocaleDateString(),
            nestPieces: this.nestPiecesCollected
        });

        // Sort by score (highest first)
        highScores.sort((a, b) => b.score - a.score);

        // Keep only top 5 scores
        highScores = highScores.slice(0, 5);

        // Save back to local storage
        localStorage.setItem('birdGameHighScores', JSON.stringify(highScores));
    }
}

// Menu Scene (Start Screen)
class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'MenuScene'
        });
    }

    preload() {
        // Load assets locally
        this.load.image('playerbird', 'assets/playerbird.png');
        this.load.image('background', 'assets/newbackground.png');
        this.load.image('cloud', 'assets/cloud.png');
        
        // Load menu sound
        this.load.audio('menuMusic', 'assets/audio/menu_music.mp3');
        this.load.audio('buttonClick', 'assets/audio/button_click.mp3');
    }

    create() {
        // Initialize audio
        this.menuMusic = this.sound.add('menuMusic', {
            volume: 0.5,
            loop: true
        });
        this.buttonClickSound = this.sound.add('buttonClick', { volume: 0.6 });
        
        // Start menu music
        this.menuMusic.play();
        
        // Create background that fills the menu scene
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        this.add.sprite(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(gameWidth, gameHeight);

        // Add some decorative clouds
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(50, 200);
            const cloud = this.add.image(x, y, 'cloud').setScale(0.2);

            // Add a floating animation to clouds
            this.tweens.add({
                targets: cloud,
                y: y + Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(3000, 6000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }

        // Add game title
        const title = this.add.text(400, 150, 'BIRD NEST ADVENTURE', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Animated bird character
        const bird = this.add.sprite(400, 280, 'playerbird').setScale(0.1);

        // Add animation to the bird
        this.tweens.add({
            targets: bird,
            y: bird.y - 20,
            scaleX: 0.11,
            scaleY: 0.11,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Create "Start Game" button
        const startButton = this.add.text(400, 380, 'Start Game', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#007700',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5).setInteractive();

        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.setStyle({
                backgroundColor: '#009900'
            });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({
                backgroundColor: '#007700'
            });
        });

        // Start game on click
        startButton.on('pointerdown', () => {
            // Play button click sound
            this.buttonClickSound.play();
            
            // Stop menu music
            this.menuMusic.stop();
            
            this.scene.start('GameScene');
        });

        // Create "High Scores" button
        const highScoreButton = this.add.text(400, 450, 'High Scores', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#555555',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5).setInteractive();

        // Button hover effect
        highScoreButton.on('pointerover', () => {
            highScoreButton.setStyle({
                backgroundColor: '#777777'
            });
        });

        highScoreButton.on('pointerout', () => {
            highScoreButton.setStyle({
                backgroundColor: '#555555'
            });
        });

        // Go to high scores on click
        highScoreButton.on('pointerdown', () => {
            // Play button click sound
            this.buttonClickSound.play();
            
            this.scene.start('HighscoreScene');
        });

        // Game instructions
        this.add.text(400, 520, 'Use arrow keys to fly and collect nest pieces', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setStroke('#000000', 4);
    }
}

// Highscore Scene
class HighscoreScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'HighscoreScene'
        });
    }

    init(data) {
        // If data is passed, store the last score
        this.lastScore = data.lastScore !== undefined ? data.lastScore : null;
    }

    preload() {
        // Load background assets if not already loaded
        if (!this.textures.exists('background')) {
            this.load.image('background', 'assets/newbackground.png');
        }
        
        // Load button click sound if needed
        this.load.audio('buttonClick', 'assets/audio/button_click.mp3');
    }

    create() {
        // Initialize sound
        this.buttonClickSound = this.sound.add('buttonClick', { volume: 0.6 });
        
        // Create background
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        this.add.sprite(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(gameWidth, gameHeight)
            .setTint(0xCCDDFF); // Light blue tint for the background

        // Title
        this.add.text(400, 100, 'HIGH SCORES', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5).setStroke('#000000', 6);

        // Display the last score if available
        if (this.lastScore !== null) {
            this.add.text(400, 170, 'Your Score: ' + this.lastScore, {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#FFFF00'
            }).setOrigin(0.5).setStroke('#000000', 4);
        }

        // Get high scores from local storage
        const highScores = JSON.parse(localStorage.getItem('birdGameHighScores')) || [];

        // Create a container for score display
        const scorePanel = this.add.rectangle(400, 350, 500, 300, 0x000000, 0.5)
            .setStrokeStyle(2, 0xFFFFFF);

        // If no high scores yet
        if (highScores.length === 0) {
            this.add.text(400, 350, 'No high scores yet!\nComplete a game to set a record.', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        } else {
            // Header for the high scores table
            this.add.text(400, 230, 'Rank    Score    Nest Pieces    Date', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setStroke('#000000', 4);

            // Display high scores
            highScores.forEach((scoreData, index) => {
                const y = 280 + index * 40;
                const rankColor = index === 0 ? '#FFD700' : '#FFFFFF'; // Gold for first place

                // Display each score entry
                this.add.text(400, y,
                    `${index + 1}       ${scoreData.score}       ${scoreData.nestPieces}         ${scoreData.date}`, {
                        fontFamily: 'Arial',
                        fontSize: '20px',
                        color: rankColor,
                        align: 'center'
                    }
                ).setOrigin(0.5).setStroke('#000000', index === 0 ? 4 : 2);
            });
        }

        // Create back to menu button
        const menuButton = this.add.text(400, 500, 'Back to Menu', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#225599',
            padding: {
                x: 20,
                y: 10
            }
        }).setOrigin(0.5).setInteractive();

        // Button hover effect
        menuButton.on('pointerover', () => {
            menuButton.setStyle({
                backgroundColor: '#3366BB'
            });
        });

        menuButton.on('pointerout', () => {
            menuButton.setStyle({
                backgroundColor: '#225599'
            });
        });

        // Go back to main menu
        menuButton.on('pointerdown', () => {
            // Play button click sound
            this.buttonClickSound.play();
            
            this.scene.start('MenuScene');
        });

        // Play again button (only shown after a game)
        if (this.lastScore !== null) {
            const playAgainButton = this.add.text(400, 560, 'Play Again', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#009900',
                padding: {
                    x: 20,
                    y: 10
                }
            }).setOrigin(0.5).setInteractive();

            // Button hover effect
            playAgainButton.on('pointerover', () => {
                playAgainButton.setStyle({
                    backgroundColor: '#00BB00'
                });
            });

            playAgainButton.on('pointerout', () => {
                playAgainButton.setStyle({
                    backgroundColor: '#009900'
                });
            });

            // Start a new game
            playAgainButton.on('pointerdown', () => {
                // Play button click sound
                this.buttonClickSound.play();
                
                this.scene.start('GameScene');
            });
        }
    }
}

// Configure the Phaser game
const container = document.getElementById('renderDiv');
const config = {
    type: Phaser.AUTO,
    parent: container,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    backgroundColor: '#87CEEB', // Sky blue background color to avoid black voids
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 0
            },
            debug: false
        }
    },
    scene: [MenuScene, InfiniteBirdGame, HighscoreScene]
};

// Initialize the game
window.phaserGame = new Phaser.Game(config);