new Vue({
    el: '#app',
    data: {
        names: [
            "顾俊伟", "姜师恩", "马明杰", "葛定志", "梁亚茹",
            "李耀青", "姜  媛", "孙佳琪", "陈  辉", "姚艳芳",
            "肖  玲", "葛翠花", "侯吉雨", "袁菲菲",
            "刘  雯", "王曼曼", "韩双利", "黄荣", "王展鹏",
            "陈  丽", "邵进玉", "蒋重阳", "陆云燕", "赵梦玲",
            "乔红", "曹金玉", "葛旭", "王莉", "高冬梅", "杨卓琳",
            "王豆豆", "高丹", "唐慧", "冯辉", "徐文研","孙文杰",
            "罗自婷", "苗诗涛", "刘亚蒙", "蔡仲囡", "潘稳",
            "姜梦晓", "王雪", "唐娇娇", "石瑾", "樊  兴", "李晨",
            "郝芳", "李科奇", "杨美燕","吴贝贝", "李香英", "杨倩",
            "许红艳", "颜莹露", "张荣容", "曾欢", "钱康", "潘彩云", "曹政文",
            "朱凯旋", "朱  敏", "王丽瑞", "蒋丽婷",
            "王敏慧", "徐航", "陈阳", "刘倩", "金星",
            "徐浩", "杨晟", "孙宇庭", "丁媛", "翟振宇",
            "孙丽", "成露思", "陈洁", "顾莉", "陈果","余建",
            "杜坤", "麦阿会", "王若缘", "倪加鑫", "姜玉",
            "孙倩", "蔺秀", "徐天文", "吴昊旻",
            "朱星辰", "匡俊杰", "黎以兰", "常柯",
            "陆楼", "孙玥","杨迪"
        ],
        currentName: '',
        currentIndex: '',
        timer: null,
        isRolling: false,
        showCelebration: false,
        rollSound: null,
        prizeConfig: {
            1: { total: 1, name: '一等奖' },
            2: { total: 3, name: '二等奖' },
            3: { total: 6, name: '三等奖' }
        },
        remainingCounts: {
            1: 1,
            2: 3,
            3: 6
        },
        winners: {
            1: [],
            2: [],
            3: []
        },
        currentLevel: null,
        rollInterval: 40,
        celebrationTimer: null,
        showFlash: false,
    },
    methods: {
        initializeData() {
            const savedWinners = localStorage.getItem('lottery_winners');
            if (savedWinners) {
                this.winners = JSON.parse(savedWinners);
                console.log(this.winners);
                Object.keys(this.prizeConfig).forEach(level => {
                    this.remainingCounts[level] = this.prizeConfig[level].total - this.winners[level].length;
                });
                const allWinners = Object.values(this.winners).flat();
                console.log(allWinners);
                this.names = this.names.filter(name => !allWinners.includes(name));
            }
            this.rollSound = document.getElementById('rollSound');
        },
        handleShortcut(event) {
            if (event.ctrlKey && event.key === 'r') { // 检查是否按下 Ctrl + R
                event.preventDefault(); // 阻止浏览器默认刷新行为
                if (confirm('确定要清除所有中奖数据吗？')) {
                    this.clearWinners();
                }
            }
        },
        triggerFlash() {
            this.showFlash = true;
            setTimeout(() => {
                this.showFlash = false;
            }, 1000);
        },

        getWeightedRandom(names) {
            if (names.length === 0) return null;

            const weights = [];
            let totalWeight = 0;
            const Countx = 4;


            for (let i = 0; i < names.length; i++) {
                let weight;

                if (i < Countx || i >= names.length - Countx) {
                    weight = 0;
                } else {
                    weight = 1;
                }

                weights.push(weight);
                totalWeight += weight;
            }
            // 生成随机数
            let random = Math.random() * totalWeight;

            let cumulativeWeight = 0;
            for (let i = 0; i < names.length; i++) {
                cumulativeWeight += weights[i];
                if (random <= cumulativeWeight && weights[i] > 0) {
                    return names[i];
                }
            }

            // 防止意外情况，返回最后一个有效位置
            for (let i = names.length - Countx - 1; i >= Countx; i--) {
                return names[i];
            }
        },

        toggleRoll(level) {
            if (this.remainingCounts[level] === 0) return;

            if (!this.isRolling) {
                this.startRolling(level);
            } else if (this.currentLevel === level) {
                this.stopRolling(level);
            }
        },

        startRolling(level) {
            this.isRolling = true;
            this.currentLevel = level;
            this.rollSound.play();

            let speed = this.rollInterval;
            let acceleration = 1.0;

            const roll = () => {
                const randomIndex = Math.floor(Math.random() * this.names.length);
                this.currentName = this.names[randomIndex];
                this.currentIndex = randomIndex;
                speed *= acceleration;

                this.timer = setTimeout(roll, speed);
            };

            roll();
        },

        stopRolling(level) {
            clearTimeout(this.timer);
            this.isRolling = false;
            this.rollSound.pause();
            this.rollSound.currentTime = 0;

            const winner = this.getWeightedRandom(this.names);
            this.currentName = winner;
            // const winner = this.currentName;
            const prize = this.prizeConfig[level].name;
            this.winners[level].push(winner);
            this.saveWinners();
            this.names = this.names.filter(name => name !== winner);
            this.remainingCounts[level]--;

            this.showCelebration = true;
            this.startCelebration();
            this.triggerFlash();

            // 播报中奖人和奖项
            this.announceWinner(winner, prize);

            setTimeout(() => {
                this.showCelebration = false;
            }, 3000);

            this.currentLevel = null;
        },
        // 新增方法：获取可用的语音并选择一个
        getAvailableVoices() {
            const voices = window.speechSynthesis.getVoices();
            // 这里可以根据需求选择语音，如选一个中文男声
            const chineseMaleVoice = voices.find(voice => voice.lang === 'zh-CN' && voice.name.includes('Xiaoxiao')); // 例如：选择中文的“晓晓”女声
            return chineseMaleVoice || voices[0]; // 默认使用第一个语音
        },
        // 新增一个方法用于播报中奖信息
        announceWinner(winner, prize) {
            const utterance = new SpeechSynthesisUtterance(`恭喜${winner}中了${prize}`);
            utterance.lang = 'zh-CN'; // 设置语言为中文
            utterance.volume = 1; // 设置音量，范围0到1
            utterance.rate = 1; // 设置语速，范围0.1到10
            utterance.pitch = 1; // 设置语调，范围0到2

            // 设置语音
            const voice = this.getAvailableVoices();
            utterance.voice = voice;
            // 播放语音
            window.speechSynthesis.speak(utterance);
        },

        saveWinners() {
            localStorage.setItem('lottery_winners', JSON.stringify(this.winners));
        },

        createConfetti() {
            const container = document.querySelector('.celebration-container');
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = ['#FFD700', '#FFA500', '#FF69B4', '#00FF00'][Math.floor(Math.random() * 4)];
            confetti.style.animation = `confetti-fall ${2 + Math.random() * 3}s linear`;
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        },

        createCoin() {
            const container = document.querySelector('.celebration-container');
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.textContent = '￥';
            coin.style.left = Math.random() * 100 + 'vw';
            coin.style.animation = `coin-drop ${1.5 + Math.random() * 2}s linear`;
            container.appendChild(coin);
            setTimeout(() => coin.remove(), 3000);
        },

        createFirework() {
            const container = document.querySelector('.celebration-container');
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = Math.random() * 100 + 'vw';
            firework.style.top = Math.random() * 100 + 'vh';
            firework.style.backgroundColor = ['#FFD700', '#FFA500', '#FF69B4', '#00FF00'][Math.floor(Math.random() * 4)];

            const animation = firework.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(50)', opacity: 0 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });

            container.appendChild(firework);
            animation.onfinish = () => firework.remove();
        },

        startCelebration() {
            // 清除之前的定时器
            clearInterval(this.celebrationTimer);

            // 创建新的庆祝效果
            this.celebrationTimer = setInterval(() => {
                if (this.showCelebration) {
                    for (let i = 0; i < 3; i++) {
                        this.createConfetti();
                        if (Math.random() > 0.5) this.createCoin();
                        if (Math.random() > 0.7) this.createFirework();
                    }
                }
            }, 100);

            // 5秒后停止庆祝效果
            setTimeout(() => {
                clearInterval(this.celebrationTimer);
            }, 5000);
        },
        clearWinners() {
            localStorage.removeItem('lottery_winners');
            // 刷新页面
            location.reload();
        },
        saveTestResults(results) {
            // Create a Blob from the results
            const blob = new Blob([results.join('\n')], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'lottery_test_results.txt';
            link.click();
        },
        test() {
            const testResults = [];
            const totalDraws = 1000;   // 总共需要进行的抽奖次数
            const resetInterval = 10;  // 每九次抽奖后重置

            const simulateDraw = () => {
                let originalNames = [...this.names]; // 保存原始名单以用于重置
                var num  = 0;
                for (let i = 0; i < totalDraws; i++) {
                    if (i % resetInterval === 0 && i !== 0 ) { // 每9次完成后进行重置
                        this.names = [...originalNames]; // 重置名单
                        num++;
                        testResults.push('\n\r'); // 每9次抽奖后，添加空行

                    }
                    // 每次抽奖前，检查是否需要重置名单
                    const winner = this.getWeightedRandom(this.names);
                    // 如需模拟真实抽奖，可从列表中删除抽中的名字
                    this.names = this.names.filter(name => name !== winner);

                    // 保存测试结果
                    testResults.push(`第${num + 1}轮模拟测试|${winner}`);
                }

                // 生成一个含测试结果的文本文件
                this.saveTestResults(testResults);
            };

            simulateDraw();
        },

        getPrizeLevel(winner) {
            // You can adjust this function based on how your prize levels are assigned.
            if (this.remainingCounts[1] > 0) {
                return '一等奖';
            } else if (this.remainingCounts[2] > 0) {
                return '二等奖';
            } else {
                return '三等奖';
            }
        },
        canDraw(level) {
            if (level === 3) return true;
            if (level === 2) return this.remainingCounts[3] === 0;
            if (level === 1) return this.remainingCounts[2] === 0;
            return false;
        }
    },
    mounted() {
        this.currentName = '点击按钮开始';
        this.initializeData();
        // 绑定 Ctrl + R 快捷键
        window.addEventListener('keydown', this.handleShortcut);

        window.test = this.test;


    },
    beforeDestroy() {
        clearInterval(this.celebrationTimer);
        window.removeEventListener('keydown', this.handleShortcut);
    }
});

document.getElementById('help-button').addEventListener('click', () => {
    const helpBox = document.getElementById('help-box');
    helpBox.classList.toggle('show');
});
