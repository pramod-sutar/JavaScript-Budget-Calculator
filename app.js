// Budget Controller
var BudgetController = (function () {

    var Income = function (id, description, amount) {
        this.id = id;
        this.description = description;
        this.amount = amount;
    };

    var Expense = function (id, description, amount) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function (totalIncome) {
        if (totalIncome > 0)
            this.percentage = Math.round((this.amount / totalIncome) * 100);
        else
            this.percentage = -1;
    };

    Expense.prototype.getPercentage = function () {
        return this.percentage;
    };

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function (current) {
            sum += current.amount;
        });
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    return {
        addItem: function (type, desp, val) {
            var newItem, ID;

            // Create new ID
            var typeLength = data.allItems[type].length;
            if (typeLength > 0)
                ID = data.allItems[type][typeLength - 1].id + 1;
            else
                ID = 0;

            // Create new Item based on exp or inc
            if (type === "exp") {
                newItem = new Expense(ID, desp, val);
            } else if (type === "inc") {
                newItem = new Income(ID, desp, val);
            }

            // Push it to data structure
            data.allItems[type].push(newItem);

            // Return the new element
            return newItem;
        },

        deleteItem: function (type, id) {
            var ids, index;

            ids = data.allItems[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1)
                data.allItems[type].splice(index, 1);
        },

        calculateBudget: function () {
            // Calculate total income and expenses
            calculateTotal("exp");
            calculateTotal("inc");

            // Calculate the budget : income -expense
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent
            // Ex : Exp=100 Inc=200 then percentage=50% ==> (100/200)*100=50
            if (data.totals.inc > 0)
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            else
                data.percentage = -1;

        },

        calculatePercentages: function () {
            /*
                a=20
                b=10
                c=40
                income=100
                a=20/100=20%
                b=10/100=10%
                c=40/100=40%
            */
            data.allItems.exp.forEach(function (curr) {
                curr.calcPercentage(data.totals.inc);
            });
        },

        getPercentage: function () {
            var allPercentages = data.allItems.exp.map(function (curr) {
                return curr.getPercentage();
            });
            return allPercentages;
        },

        getBudget: function () {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        testing: function () {
            console.log(data);
        }
    };

})();

// UI Controller
var UIController = (function () {

    var DOMClassStrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__value",
        addButton: ".add__btn",
        incomeContainer: ".income__list",
        expenseContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expenseLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: ".container",
        expensesPercentageLabel: ".item__percentage",
        dateLabel: ".budget__title--month"
    };

    var formatNumber = function (num, type) {
        /*
            + or - Before the number
            exact 2 decimals
            comma separator for thousands
            round to two decimals
        */
        var numSplit, int, dec;
        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split(".");
        int = numSplit[0];
        dec = numSplit[1];

        if (int.length > 3)
            int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, int.length);

        return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
    };

    var nodeListForEach = function (list, callback) {
        for (var counter = 0; counter < list.length; counter++) {
            callback(list[counter], counter);
        }
    };

    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMClassStrings.inputType).value, // either inc or exp
                description: document.querySelector(DOMClassStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMClassStrings.inputValue).value)
            };
        },

        addListItem: function (obj, type) {
            var html, element;

            // Create HTML string with placeholder text
            if (type === "exp") {
                element = DOMClassStrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === "inc") {
                element = DOMClassStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Replace the placeholder text with actual data.
            html = html.replace('%id%', obj.id);
            html = html.replace('%description%', obj.description);
            html = html.replace('%value%', formatNumber(obj.amount, type));

            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML("beforeend", html);
        },

        deleteListItem: function (selectorID) {
            var element = document.getElementById(selectorID);
            element.parentElement.removeChild(element);
        },

        clearFields: function () {
            var fields, fieldsArr;

            fields = document.querySelectorAll(DOMClassStrings.inputDescription + "," + DOMClassStrings.inputValue);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();
        },

        displayBudget: function (obj) {
            var type = obj.budget > 0 ? "inc" : "exp";
            document.querySelector(DOMClassStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMClassStrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
            document.querySelector(DOMClassStrings.expenseLabel).textContent = formatNumber(obj.totalExp, "exp");
            if (obj.percentage > 0)
                document.querySelector(DOMClassStrings.percentageLabel).textContent = obj.percentage + " %";
            else document.querySelector(DOMClassStrings.percentageLabel).textContent = "---";
        },

        displayPercentages: function (percentages) {
            var fields = document.querySelectorAll(DOMClassStrings.expensesPercentageLabel);

            nodeListForEach(fields, function (curr, index) {
                if (percentages[index] > 0)
                    curr.textContent = percentages[index] + "%";
                else
                    curr.textContent = "---";
            });
        },

        displayMonth: function () {
            var now, months, month, year;
            months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            now = new Date();
            month = months[now.getMonth()];
            year = now.getFullYear();

            document.querySelector(DOMClassStrings.dateLabel).textContent = month + "-" + year;
        },

        changeType: function () {
            var fields = document.querySelectorAll(DOMClassStrings.inputType +
                "," + DOMClassStrings.inputDescription +
                "," + DOMClassStrings.inputValue);

            nodeListForEach(fields, function (curr) {
                curr.classList.toggle("red-focus");
            });

            document.querySelector(DOMClassStrings.addButton).classList.toggle("red");
        },

        getDOMClassStrings: function () {
            return DOMClassStrings;
        }
    };

})();

// Global main App Controller
var MainController = (function (objBudgetController, objUIController) {

    var setUpEventListners = function () {
        var DOM = objUIController.getDOMClassStrings();

        document.querySelector(DOM.addButton).addEventListener("click", ctrlAddItem);

        document.addEventListener("keypress", function (e) {
            if (e.keyCode === 13 || e.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener("change", objUIController.changeType);
    };

    setUpInitialValues = function () {
        objUIController.displayBudget({
            budget: 0,
            totalInc: 0,
            totalExp: 0,
            percentage: -1
        });
        objUIController.displayMonth();
    };

    var updateBudget = function () {
        // 1. Calculate the budget
        objBudgetController.calculateBudget();

        // 2. Return the budget
        var budget = objBudgetController.getBudget();

        // 3. Display the budget on UI
        objUIController.displayBudget(budget);
    };

    var updatePercentages = function () {
        // 1. Calculate percentages
        objBudgetController.calculatePercentages();

        // 2. Read percentages from the budget controller
        var percentages = objBudgetController.getPercentage();

        // 3. Update the UI from the percentage
        objUIController.displayPercentages(percentages);
    };

    var ctrlAddItem = function () {
        var input, newItem;

        // 1. Get Input Data
        input = objUIController.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the items to budget controller
            newItem = objBudgetController.addItem(input.type, input.description, input.value);

            // 3. Add the items to the UI
            objUIController.addListItem(newItem, input.type);

            // 4. Clear Fields
            objUIController.clearFields();

            // 5. Calculate and update budget
            updateBudget();

            // 6. Calculate and update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function (event) {
        var itemID, splitID, ID, type;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if (itemID) {
            // Ex : inc-0, exp-1
            splitID = itemID.split("-");
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // 1. Delete the item from the data structure
            objBudgetController.deleteItem(type, ID);
            // 2. Delete the item from the UI
            objUIController.deleteListItem(itemID);

            // 3. Update and show the new budget
            updateBudget();

            // 4. Calculate and update percentages
            updatePercentages();
        }
    };

    return {
        init: function () {
            console.log("Application Has Been Started.");
            setUpEventListners();
            setUpInitialValues();
        }
    };
})(BudgetController, UIController);

MainController.init();