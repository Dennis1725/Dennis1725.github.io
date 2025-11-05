const Responsive = {
    getScreenDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    },

    calculatePlayerSpeed() {
        const { width, height } = this.getScreenDimensions();
        const baseSpeed = 3;
        const speedFactor = Math.min(width, height) / 1000;
        return baseSpeed * speedFactor * 0.7; // Reduced by 30%
    },

    calculateObjectSize(baseSize = 40) {
        const { width, height } = this.getScreenDimensions();
        const sizeFactor = Math.min(width, height) / 800;
        return baseSize * sizeFactor;
    },

    calculatePlayfieldDimensions() {
        const { width, height } = this.getScreenDimensions();
        return {
            width: width * 0.8,
            height: height * 0.6
        };
    },

    calculateObstacleCount() {
        const { width } = this.getScreenDimensions();
        if (width < 768) return 3;        // mobile
        if (width < 1440) return 4;       // tablet
        return 6;                         // desktop
    }
};

export default Responsive;
