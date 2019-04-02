////////////////////////////////////////////
var sigpad = document.getElementById("sigcanv");
var canvinp = document.getElementById("sig-input");
var ctx = sigpad.getContext("2d");
let draw = false;
var mouseX;
var mouseY;

function signature(e) {
    if (draw == true) {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(e.offsetX, e.offsetY);
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        ctx.stroke();
    }
}
sigpad.addEventListener("mousedown", function(e) {
    draw = true;
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});
sigpad.addEventListener("mousemove", signature);
sigpad.addEventListener("mouseout", () => {
    draw = false;
    canvinp.value = sigpad.toDataURL();
});
sigpad.addEventListener("mouseup", () => {
    draw = false;
    canvinp.value = sigpad.toDataURL();
});
///////////////////////////////////////////////
