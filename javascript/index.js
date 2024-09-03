
document.addEventListener('DOMContentLoaded', () => {
    var inventory = document.getElementById('inventory-texture');
    inventory.querySelector('embed').addEventListener('load', () => {
        setupListener()
        setInventorySlots(9)

        var inventory = document.getElementById('inventory');
        var embed = inventory.querySelector('embed');

        var svgDoc = embed.getSVGDocument();

        var svg = svgDoc.querySelector('svg');
        var item_row = svg.querySelector('.item_row');

        addItemSlots(item_row.querySelectorAll('foreignObject'));
        setMenuName("Menu")
    });

    loadItemImages();
});

function loadItemImages() {
    fetch('../images/items_1.21/_item_list.json')
        .then(response => response.json())
        .then(files => {
            const item_browser = document.getElementById('item_container');

            files.forEach(file => {
                const div = document.createElement('div');
                div.classList.add("item");
                const img = document.createElement('img');

                img.src = `../images/items_1.21/${file}`
                img.id = crypto.randomUUID();
                img.alt = file;
                img.setAttribute('draggable', true);

                img.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text', e.target.id);

                    img.style.opacity = 0.5;
                })

                img.addEventListener('dragend', () => {
                    img.style.opacity = 1;
                })

                div.appendChild(img);
                item_browser.appendChild(div);
            }
            )
        }
        )
}

function setInventorySlots(amount) {
    var inventory = document.getElementById('inventory');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();

    var svg = svgDoc.querySelector('svg');
    var item_row = svg.querySelector('.item_row');

    var bottom_border = svg.getElementById('bottom_border')
    var top_border = svg.getElementById('top_border');

    var item_rows = svg.querySelectorAll('.item_row');

    let previousRowsAmt = item_rows.length;
    let rowsDiff = amount / 9 - previousRowsAmt;
    console.log('pre: ' + previousRowsAmt)
    console.log('diff: ' + rowsDiff)
    console.log('amt: ' + amount / 9)

    if(rowsDiff > 0) {
        for (let i = 1; i < rowsDiff + 1; i++) {
            var newRow = item_row.cloneNode(true);
    
            moveSvgGroupTo(newRow, 0, item_row.getBBox().y + 2 + item_row.getBBox().height * (svg.querySelectorAll('.item_row').length - 1));
    
            svg.appendChild(newRow);

            addItemSlots(newRow.querySelectorAll('foreignObject'));
        }
    } else if(rowsDiff < 0) {
        let slot_rows = document.querySelectorAll('.slot-row')
        for (let i = amount / 9; i < item_rows.length; i++) {
            svg.removeChild(item_rows[i]);
            slot_rows[i].remove();
        }
    }
    moveSvgGroupTo(bottom_border, svg.getBBox().x, svg.getBBox().y + top_border.getBBox().height + item_row.getBBox().height * svg.querySelectorAll('.item_row').length - 2);

    let svgWidth = parseFloat(svg.getAttribute('width'));
    let newHeight = svg.getBBox().height;
    svg.setAttribute('height', newHeight);

    // Update the viewBox to accommodate the new height
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${newHeight}`);
}

function addItemSlots(foreignObjects) {
    const row = document.createElement('div');
    row.classList.add('slot-row');
    foreignObjects.forEach(foreignObject => {
        const div = document.createElement('div');
        div.classList.add('item_slot');
        div.style.position = 'absolute';
        div.style.left = foreignObject.getBoundingClientRect().x + 'px';
        div.style.top = foreignObject.getBoundingClientRect().y + 'px';
        div.style.width = foreignObject.getBoundingClientRect().width + 'px';
        div.style.height = foreignObject.getBoundingClientRect().height + 'px';

        const amount = document.createElement('div');
        amount.classList.add('item-slot-amount');

        div.addEventListener('click', (e) => itemSlotClick(e.target));

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        div.addEventListener('drop', (e) => {
            e.preventDefault();

            const draggedElementId = e.dataTransfer.getData('text');
            const draggedElement = document.getElementById(draggedElementId).cloneNode(true);
            draggedElement.style.opacity = 1;

            div.appendChild(draggedElement);
        });

        div.appendChild(amount);
        row.appendChild(div);
    });
    document.getElementById('item_slots_container').appendChild(row);
}

function itemSlotClick(target) {
    document.querySelectorAll('.active-slot').forEach(element => {
        element.classList.remove('active-slot');
    })
    target.classList.add('active-slot');
    var right_sidebar = document.querySelector('.right-sidebar');
    right_sidebar.style.display = "grid";
    console.log(target);
}

function moveSvgGroupTo(group, targetX, targetY) {
    // Calculate the current bounding box of the group
    const bbox = group.getBBox();
    const currentX = bbox.x;
    const currentY = bbox.y;

    // Calculate the difference between the target and current positions
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    // Move each element within the group by the calculated difference
    group.querySelectorAll('*').forEach(element => {
        // Move x coordinate if it exists
        if (element.hasAttribute('x')) {
            var elementX = parseFloat(element.getAttribute('x'));
            element.setAttribute('x', elementX + dx);
        }

        // Move y coordinate if it exists
        if (element.hasAttribute('y')) {
            var elementY = parseFloat(element.getAttribute('y'));
            element.setAttribute('y', elementY + dy);
        }
    });
}

function updateMenuName() {
    var input = document.querySelector('.left-sidebar #name_input')
    var value = input.value;

    setMenuName(value);
}

function setMenuName(value) {
    var inventory = document.getElementById('inventory-texture');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();
    var svg = svgDoc.querySelector('svg');

    var textElement = svg.getElementById('menu_name');
    textElement.textContent = value;
}

function updateMenuSlots() {
    var input = document.getElementById('slots_input');
    var value = input.value;

    var errorText = document.querySelector('#slots_error span');
    if (value < 9) {
        errorText.innerHTML = "Please provide a number larger than 8"
        return;
    } else if (value > 54) {
        errorText.innerHTML = "Please provide a number smaller than 55"
        return;
    } else if (value % 9 != 0) {
        errorText.innerHTML = "Please provide a multiple of 9"
        return;
    }
    setInventorySlots(value)
}

function updateItemAmount() {
    var input = document.getElementById('amount_input');
    var value = input.value;

    var errorText = document.querySelector('#item_amount_error span');
    if (value < 1 && value != '') {
        errorText.innerHTML = "Please provide a number larger than 0"
        return;
    } else if (value > 64 && value != '') {
        errorText.innerHTML = "Please provide a number smaller than 65"
        return;
    }
    setItemAmount(document.querySelector('.active-slot'), value);
}

function setItemAmount(element, amount) {
    if(amount == 1 || amount == '') {
        element.innerHTML = '';
    } else {
        element.innerHTML = amount;
    }
}

function setupListener() {
    var slots_input = document.getElementById('slots_input');
    var item_amount_input = document.getElementById('amount_input');

    slots_input.addEventListener('input', updateMenuSlots);
    item_amount_input.addEventListener('input', updateItemAmount);
}