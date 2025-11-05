import { hasMethods } from "./utils.mjs"

const background = "#fff";
const SIDE_BUFFER_PERCENTAGE = 0.014; // 6.4% buffer on each side (reduced by 20% from 8%)

export function Layout(ctx) {
    let x, y, width, height, sum_of_children_weights = 1;
    const children = [];

    function addChild(item, weight = 1) {
        if (hasMethods(item, ["set"])) {
            children.push({ item, weight });
            sum_of_children_weights = children.reduce((acc, i) => acc += i.weight, 0);
        } else {
            console.log("layout.addChild cannot add", item);
        }
    }


    /*
    function draw() {
        if (ctx !== undefined) {
            ctx.fillStyle = background;
            ctx.fillRect(x, y, width, height);
        }
        for (const child of children) {
            child.item.draw();
        }
    }
*/
    function draw() {
    // 🟢 Don't overwrite screen background!
    for (const child of children) {
        if (child.item.draw) child.item.draw();
    }
}
    function set(nx, ny, nw, nh) {
        x = nx; y = ny; width = nw; height = nh;
    }

    return { addChild, set, draw, children: (cb) => children.forEach(cb), weights: () => sum_of_children_weights };
}

export function HorizontalLayout(ctx) {
    const base = Layout(ctx);
    function set(nx, ny, nw, nh) {
        base.set(nx, ny, nw, nh);
        let itemX = 0;
        base.children(child => {
            const itemWidth = nw * child.weight / base.weights();
            child.item.set(nx + itemX, ny, itemWidth, nh, ctx);
            itemX += itemWidth;
        });
    }
    return { set, addChild: base.addChild, draw: base.draw };
}

export function VerticalLayout(ctx) {
    const base = Layout(ctx);
    function set(nx, ny, nw, nh) {
        base.set(nx, ny, nw, nh);
        let itemY = 0;
        base.children(child => {
            const itemHeight = nh * child.weight / base.weights();
            child.item.set(nx, ny + itemY, nw, itemHeight, ctx);
            itemY += itemHeight;
        });
    }
    return { set, addChild: base.addChild, draw: base.draw };
}


export function ToggleLayout(minAspectRatio = 1) {
    const hor = HorizontalLayout();
    const ver = VerticalLayout();

    let drawHorizontal = true;

    function set(nx, ny, nw, nh) {
        drawHorizontal = nw > nh * minAspectRatio;
        if (drawHorizontal)
            hor.set(nx, ny, nw, nh);
        else
            ver.set(nx, ny, nw, nh);
    }

    function draw() {
        if (drawHorizontal)
            hor.draw();
        else
            ver.draw();
    }

    function addChild(item, weight = 1) {
        hor.addChild(item, weight);
        ver.addChild(item, weight);
    }

    return { set, addChild, draw };
}

export function calculateLayout() {
    // Get device screen width and height
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate buffer size
    const sideBuffer = screenWidth * SIDE_BUFFER_PERCENTAGE;
    
    // Calculate playable area
    const playableWidth = screenWidth - (sideBuffer * 2);
    const playableHeight = screenHeight;

    // Update canvas size to match screen
    const canvas = document.getElementById('cnv');
    canvas.width = screenWidth;
    canvas.height = screenHeight;

    return {
        width: screenWidth,
        height: screenHeight,
        playableWidth: playableWidth,
        playableHeight: playableHeight,
        leftBuffer: sideBuffer,
        rightBuffer: sideBuffer,
        // Add other layout properties you need...
    };
}

// Add window resize listener to update layout
window.addEventListener('resize', () => {
    calculateLayout();
});




