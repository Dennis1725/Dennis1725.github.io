/**
 * Layout module - manages responsive layouts
 */
import { hasMethods } from "./utils.mjs";

function Layout(ctx) {
    let x, y, width, height, sumOfWeights = 1;
    const children = [];

    function addChild(item, weight = 1) {
        if (!hasMethods(item, ["set"])) {
            console.warn("Layout.addChild: Item missing 'set' method", item);
            return;
        }
        
        children.push({ item, weight });
        sumOfWeights = children.reduce((sum, child) => sum + child.weight, 0);
    }

    function draw() {
        children.forEach(child => {
            if (child.item.draw) {
                child.item.draw();
            }
        });
    }

    function set(nx, ny, nw, nh) {
        x = nx;
        y = ny;
        width = nw;
        height = nh;
    }

    return {
        addChild,
        set,
        draw,
        children: (callback) => children.forEach(callback),
        weights: () => sumOfWeights
    };
}

export function HorizontalLayout(ctx) {
    const base = Layout(ctx);
    
    function set(nx, ny, nw, nh) {
        base.set(nx, ny, nw, nh);
        
        let currentX = 0;
        base.children(child => {
            const itemWidth = nw * child.weight / base.weights();
            child.item.set(nx + currentX, ny, itemWidth, nh, ctx);
            currentX += itemWidth;
        });
    }
    
    return {
        set,
        addChild: base.addChild,
        draw: base.draw
    };
}

export function VerticalLayout(ctx) {
    const base = Layout(ctx);
    
    function set(nx, ny, nw, nh) {
        base.set(nx, ny, nw, nh);
        
        let currentY = 0;
        base.children(child => {
            const itemHeight = nh * child.weight / base.weights();
            child.item.set(nx, ny + currentY, nw, itemHeight, ctx);
            currentY += itemHeight;
        });
    }
    
    return {
        set,
        addChild: base.addChild,
        draw: base.draw
    };
}

export function ToggleLayout(ctx, minAspectRatio = 1) {
    const horizontal = HorizontalLayout(ctx);
    const vertical = VerticalLayout(ctx);
    let useHorizontal = true;

    function set(nx, ny, nw, nh) {
        useHorizontal = nw > nh * minAspectRatio;
        
        if (useHorizontal) {
            horizontal.set(nx, ny, nw, nh);
        } else {
            vertical.set(nx, ny, nw, nh);
        }
    }

    function draw() {
        if (useHorizontal) {
            horizontal.draw();
        } else {
            vertical.draw();
        }
    }

    function addChild(item, weight = 1) {
        horizontal.addChild(item, weight);
        vertical.addChild(item, weight);
    }

    return { set, addChild, draw };
}



