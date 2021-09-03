import AbstractSubscriber from "./abstract-subscriber.js"
import pubsub from "./pubsub.js"
import TodoProject from "./todo-project.js"
import Todo from "./todo.js"
import dateManager from "./date-manager.js"
import { TOPICS } from "./utils.js"

export default class TodoView extends AbstractSubscriber {
    #todoModel;
    #todoController;

    #projects;
    #constantProjects;
    #currentProject;
    #customProjects;
    #addProjectBtn;
    #addTodoListItem
    #editTodoForm
    #editTodoFormContainer
    #priorityList
    #projectContent;

    #projectsQueue;
    #hiddenTodo;

    #selectProject;

    #todos


    constructor(controller, model) {
        super();
        this.#todoController = controller;
        this.#todoModel = model;
        this.#projectsQueue = [];
        this.#subscribeAll();
        this.createView();

    }

    createView() {
        this.#projects = document.querySelector(".nav-projects");
        this.#constantProjects = document.querySelector(".constant-projects");
        this.#customProjects = document.querySelector(".custom-projects");
        this.#addProjectBtn = document.querySelector(".add-project-btn")
        this.#projectContent = document.querySelector(".project-content");
        this.#todos = document.querySelector(".todos");
        this.#editTodoForm = this.#todos.querySelector(".edit-todo-form");
        this.#addTodoListItem = this.#todos.querySelector(".add-todo-list-item");
        this.#editTodoFormContainer = this.#todos.querySelector(".edit-todo-list-item");
        this.#priorityList = document.querySelector(".edit-todo-priorities-list");
        this.#selectProject = document.querySelector(".select-projects");

        this.#currentProject = this.#constantProjects.firstElementChild.nextElementSibling;
        this.#currentProject.classList.add("current-project");
        // Don't allow adding todos to today's todo list.
        // Remove the option to add a todo.
        this.#toggleAddTodoDisplay(this.#todoModel.isCurrentProjectSpecial());
        this.#projectContent.querySelector("h3").innerHTML = this.#todoModel.currentProject.name;

        this.#populateTodos(this.#todoModel.currentProject.todos);

        this.#editTodoForm.querySelector(".edit-todo-area").onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
        };


        this.#selectProject.add(this.#createOption("Inbox"));

        this.#addListeners();
    }

    onClickRemoveProject(event) {
        if (confirm("Are you sure you want to remove this project?")) {
            this.#todoController.removeProject(/*TODO*/);
        }
    }

    onProjectRemoved(data) {
        console.log(data);
    }

    /**
     * Assuming data is the position of the todo to be removed
     */
    onTodoRemoved(data) {
        this.#todos.children[data].remove();
    }

    #toggleAddTodoDisplay(isCurrentProjectSpecial) {

        if (isCurrentProjectSpecial) {
            this.#addTodoListItem.style.display = "none";
        }
        else {
            this.#addTodoListItem.style.display = "block";
        }
    }
    /**
     * Add a todo list item in his position according to the way todos are sorted in the model
     * @param {Object} data an object of the form {todo, postion}
     */
    onTodoAdded(data) {
        if (data.todo instanceof Todo) {
            if (!data.isAddedToAnotherProject) {
                this.#todos.children[data.position].before(this.#createTodoListItem(data.todo));
            }
            else {
                // TODO  - when you wil l implement todos count in the nav for a project
                // you will need to get a reference to the project element in the nav.
            }

        }
    }

    #createTodoListItem(todo) {
        let todoListItem = this.#createTodoStructure();
        this.#injectTodoDetails(todoListItem, todo);
        return todoListItem;
    }

    #injectTodoDetails(todoListItem, todo) {
        todoListItem.dataset.id = todo.id;
        todoListItem.querySelector(".todo-list-item-title").innerHTML = todo.title;
        todoListItem.querySelector(".todo-list-item-date").innerHTML = dateManager.toDateString(todo.dueDate);
        todoListItem.querySelector(".todo-list-item-priority").innerHTML = todo.priority;

    }

    #createTodoStructure() {
        let todoListItemTemplate = this.#todos.querySelector("template");
        return todoListItemTemplate.content.cloneNode(true).children[0];

    }
    /**
     * Event delegation to the document.
     * @param {EventTarget} event click event in side the todos list
     */
    onTodosClick(event) {
        // don't allow any action on the todos list if the form is open.
        // The user will have to quit the fir in order to take actions on the todos list
        if (!this.#isEditTodoFormDisplayed()) {
            // If the user clicked on the delete todo icon then delete the todo
            if (event.target.tagName === "I") {
                this.#todoController.removeTodo(event.target.closest("li").dataset.id);
            }
            //  Else we check if the user clicked on a list item inside the todo list

            else {
                let todoListItem = this.#getContainingListItem(event.target);
                if (todoListItem) {

                    /* We split to cases depends on each type of list item: */

                    // If the user wants to add a new todo
                    if (todoListItem.classList.contains("add-todo-list-item")) {
                        this.#addTodo();

                    }
                    // Else if the user wants to expand an existing todo or move a todo to a different project
                    else {
                        this.#onTodoClick(todoListItem, event);

                    }
                }
            }
        }


        event.preventDefault();
        event.stopPropagation();
    }

    #onTodoClick(todoListItem, event) {
        let select = event.target.closest("select");
        if (select) {
            this.#showMoveTodoOptions(todoListItem);
        }
        else {
            this.#updateTodo(todoListItem);
        }
    }

    #showMoveTodoOptions(todoListItem) {


    }

    #updateTodo(todoListItem) {
        let todoProperties = this.#todoController.getTodoProperties(todoListItem.dataset.id);

        if (!todoProperties)
            return;

        this.#populateEditTodoForm(todoProperties);

        this.#editTodoForm.elements.submit.onclick = function (event) {
            let title = this.#editTodoForm.elements.title.value?.trim();
            if (title) {
                // TODO - the view shouldn't know about Todo. Change this.
                let updatedTodo = new Todo(title, this.#editTodoForm.elements.description.value,
                    this.#priorityList.dataset.priority, dateManager.resetHours(this.#editTodoForm.elements.date.valueAsDate))

                this.#todoController.updateTodo(todoListItem.dataset.id, updatedTodo);

            }

            this.#hideEditTodoForm();
            // TODO - no need to prevent default
            event.preventDefault();
            event.stopPropagation();

        }.bind(this);

        this.#editTodoForm.elements.cancel.onclick = function (event) {
            this.#addTodoListItem.before(this.#editTodoFormContainer);
            this.#hideEditTodoForm();
            // TODO this will get back to the less specific classList class that has a flex display
            // but this line don't looks good.
            todoListItem.style.display = ""
            event.stopPropagation();
        }.bind(this);

        todoListItem.after(this.#editTodoFormContainer);
        todoListItem.style.display = "none"
        this.#hiddenTodo = todoListItem;
        this.#showEditTodoForm();
    }

    #populateEditTodoForm(todoProperties) {
        this.#editTodoForm.elements.title.value = todoProperties.title;
        this.#editTodoForm.elements.description.value = todoProperties.description;
        this.#editTodoForm.elements.date.value = dateManager.toInputDateFormat(todoProperties.date);
        // Highlight the todo's priority in the UI
        for (let priority of this.#priorityList.children) {
            if (priority.firstChild.firstChild.nodeValue === todoProperties.priority) {
                priority.classList.add("chosen");
                // Save the priority in the dataset of the priority list since
                // if the user will not choose a priority the the priority will have
                // the value "LOW" next time the user expand this todo, 
                // because after the user submits the form, we set the priority 
                // in the dataset to the default value for priorities, which is the value "Low".
                // 
                this.#priorityList.dataset.priority = todoProperties.priority;
            }
        }
    }

    #createTodoProperties() {
        let title = this.#editTodoForm.elements.title.value?.trim();
        if (title) {

            return {
                title,
                description: this.#editTodoForm.elements.description.value,
                priority: this.#priorityList.dataset.priority,
                date: dateManager.resetHours(this.#editTodoForm.elements.date.valueAsDate)
            };

        }
    }

    /**
     * Add a new todo
     * 
     */
    #addTodo() {

        this.#editTodoForm.elements.submit.onclick = function (event) {
            let todoProperties = this.#createTodoProperties();
            if (todoProperties) {
                this.#todoController.addTodo(todoProperties);
            }

            this.#hideEditTodoForm();
            event.preventDefault();
            event.stopPropagation();

        }.bind(this);



        this.#editTodoForm.elements.cancel.onclick = function (event) {
            this.#hideEditTodoForm();
            event.stopPropagation();
        }.bind(this);

        this.#showEditTodoForm();

    }

    #isEditTodoFormDisplayed() {
        return this.#editTodoFormContainer.style.display != "none";
    }
    /**
     * get the priority that the user clicked on and use setPriority closure to set the priority in the caller
     * @param {Function} setPriority 
     */
    onPriorityClick() {
        // Get the priorities list
        let priorityList = this.#priorityList;
        // Get the priorities list elements as an array
        let priorities = Array.from(priorityList.children);
        // When the user click on a priority it will change color for it and remove color for the other two priorities
        priorityList.onclick = function (event) {
            let priority = event.target.closest("li");
            // Return if the user didn't click on a priority or this priority already marked as chosen
            if (!priority || priority.classList.contains("chosen"))
                return;

            let targetIndex = priorities.indexOf(priority);
            priority.classList.add("chosen");
            priorities[(targetIndex + 1) % 3].classList.remove("chosen");
            priorities[(targetIndex + 2) % 3].classList.remove("chosen");
            priorityList.dataset.priority = priority.firstChild.firstChild.nodeValue;


        }

    }

    #clearCurrentProjectTodos() {
        let element = this.#todos.querySelector("template");
        while (element.previousElementSibling) {
            element.previousElementSibling.remove();
        }
    }

    // TODO this method is good. Test it When the time is right.
    #populateTodos(todos) {
        for (let i = todos.length - 1; i >= 0; i--) {
            this.#todos.prepend(this.#createTodoListItem(todos[i]));
        }
    }
    /**
     * Handle the project selection menu when we switch to a different project in the nav.
     * @param {String} movedFrom the name of the project the user is leaving
     * @param {String} movedTo  the name of the project the user navigates to
     */
    #handleProjectSelectionMenu(movedFrom, movedTo) {

        if (!this.#todoModel.isSpecialProject(movedFrom)) {
            // Add the project that the user is leaving to the menu, since the user will have 
            // the option to move todos to that project
            this.#selectProject.add(this.#createOption(movedFrom));
        }
        if (!this.#todoModel.isSpecialProject(movedTo)) {
            // Remove the project that the user navigates to from the menu, since there is no point in 
            // moving todos from a project to itself 
            let optionToRemove;
            for (let option of this.#selectProject.options) {
                if (option.value === movedTo) {
                    optionToRemove = option;
                    break;
                }
            }
            if (optionToRemove) {
                optionToRemove.remove();
            }
        }

    }

    onCurrentProjectChanged(data) {
        if (data instanceof TodoProject && this.#projectsQueue.length > 0) {

            this.#handleProjectSelectionMenu(document.querySelector("li.current-project > button").textContent, data.name);

            this.#currentProject.classList.remove("current-project");
            this.#currentProject = this.#projectsQueue.splice(0, 1)[0];

            this.#clearCurrentProjectTodos();
            this.#currentProject.classList.add("current-project");
            this.#projectContent.querySelector("h3").innerHTML = data.name;
            this.#toggleAddTodoDisplay(this.#todoModel.isCurrentProjectSpecial());
            this.#populateTodos(this.#todoModel.currentProject.todos);

        }
    }


    onClickChangeCurrentProject(event) {
        let project = this.#getContainingListItem(event.target);
        if (project && this.#currentProject !== project) {
            this.#projectsQueue.push(project);
            this.#todoController.changeCurrentProject(project.querySelector("button").innerText);
        }
    }

    #getContainingListItem(element) {
        return element.closest("li");
    }

    #addListeners() {
        document.addEventListener("click", this.onDocumentClick.bind(this))
        this.#addProjectBtn.addEventListener("click", this.onClickAddProject.bind(this));
        this.#projects.addEventListener("click", this.onClickChangeCurrentProject.bind(this));
        this.#todos.addEventListener("click", this.onTodosClick.bind(this));
        this.#priorityList.addEventListener("click", this.onPriorityClick());
        this.#selectProject.addEventListener("change", this.onChangeProjectSelection.bind(this));
    }

    onChangeProjectSelection(event) {
        if (this.#hiddenTodo) {
            this.#selectProject.form.elements.submit.onclick = this.#selectProject.form.elements.cancel.onclick = null;
            this.#todoController.moveTodoToProject(this.#hiddenTodo.dataset.id, event.target.value);
        }
    }

    onTodoMoved() {

        this.#hiddenTodo.style.display = "";
        this.#hiddenTodo = null;

        this.#hideEditTodoForm();


    }

    onDocumentClick(event) {
        let nav = event.target.closest(".nav-projects");
        if (nav) {
            this.#hideEditTodoForm();
            // If this condition is true then the user expanded a todo and then clicked on the nav 
            // the todo displayed in this phase is "none". But now the form will be closed so we need to display
            // the hidden todo list item
            if (this.#hiddenTodo) {
                this.#hiddenTodo.style.display = "";
                this.#hiddenTodo = null;
            }


        }
        // This condition will be true if the user expanded a todo and then went to a different project.
        // in this case we need to put the form container in his original position.
        if (this.#addTodoListItem.previousElementSibling !== this.#editTodoFormContainer) {
            this.#addTodoListItem.before(this.#editTodoFormContainer);
        }

    }

    #showEditTodoForm() {
        this.#editTodoFormContainer.style.display = "block";
        this.#addTodoListItem.style.display = "none";
    }

    #hideEditTodoForm() {
        this.#editTodoFormContainer.style.display = "none";
        this.#editTodoForm.reset();

        this.#priorityList.dataset.priority = this.#todoModel.getDefaultPriority();
        for (let priority of this.#editTodoForm.querySelector(".edit-todo-priorities-list").children) {
            priority.classList.remove("chosen");
        }

        if (!this.#todoModel.isCurrentProjectSpecial()) {
            this.#addTodoListItem.style.display = "block";
        }
    }

    #displayTodo(todo) {
        todo.style.display = "";
    }

    #createOption(projectName) {
        let option = document.createElement("option");
        option.value = option.text = projectName;
        return option;

    }

    onProjectAdded(data) {
        if (data instanceof TodoProject) {
            let li = document.createElement("li");
            let projectBtn = document.createElement("button");
            projectBtn.append(data.name);
            li.append(projectBtn);

            this.#customProjects.prepend(li);

            // add the an option with the project name to the select element
            let option = this.#createOption(data.name);
            this.#selectProject.add(option);

        }

    }

    onProjectSorted(data) {
        console.log(data);
    }


    onTodoUpdated(data) {
        console.log(data);
    }
    onTodoChecked(data) {
        console.log(data);
    }
    onCheckedTodosRemoved(data) {
        console.log(data);
    }


    /* on clicks */

    onClickAddProject() {

        let form = document.querySelector(".one-input-project-form");
        let formContainer = this.#attachFormContainer(form, "Add New Project", "form-container");
        let modalCover = this.#createModalCover();


        // Get the project name from the form.
        // Let controller handle logic given the name of the project.
        // Quit the form and hide the modal cover.
        form.onsubmit = function () {
            let value = form.elements.text.value;
            if (value) {
                this.#todoController.addProject(value);
            }
            this.#hideModalForm(modalCover, form, formContainer);
            return false;
        }.bind(this);

        form.cancel.onclick = function () {
            this.#hideModalForm(modalCover, form, formContainer);
            return false;
        }.bind(this);

        this.#showModalForm(modalCover, form);


    }

    #attachFormContainer(form, formSubject, containerClass) {
        let formContainer = document.createElement("div");
        formContainer.classList.add(containerClass);

        form.before(formContainer);
        formContainer.innerHTML = `<span>${formSubject}</span>`;
        formContainer.append(form);

        return formContainer;
    }

    #createModalCover() {
        let modalCover = document.createElement("div");
        modalCover.classList.add("modal-cover");
        return modalCover;
    }

    #hideModalForm(modalCover, form, formContainer) {
        // Remove the form container from the DOM and replace it with the form
        formContainer.replaceWith(form);
        // Hide the form
        form.style.display = "none";
        // Remove the modal cover from the DOM and allow scrolling the body
        modalCover.remove();
        document.body.overflowY = "";
    }

    #showModalForm(modalCover, form) {
        this.#handleFocusTrap(modalCover, form);
        // Add the modal cover to the DOM 
        document.body.append(modalCover);
        // don't allow scrolling the body
        document.body.style.overflowY = "hidden";

        // Show the form 
        form.style.display = "block";
        form.elements.text.value = "";
        form.elements.text.focus();
    }
    /**
     * Make sure that when inside the form, the natural flow of passing between elements will accur
     * but when we're on the first form element and we try to go to the previous element using shift+tab
     * then we will actually go to the lsat element of the form. 
     * Also, handle the symmetric case.
     * @param {HTMLDivEelement} modalCover 
     * @param {HTMLFormElement} form 
     */
    #handleFocusTrap(modalCover, form) {
        let firstElement = form.elements[0];
        let lastElement = form.elements[form.elements.length - 1];

        lastElement.onkeydown = function (e) {
            if (e.key == 'Tab' && !e.shiftKey) {
                firstElement.focus();
                return false;
            }
        };

        firstElement.onkeydown = function (e) {
            if (e.key == 'Tab' && e.shiftKey) {
                lastElement.focus();
                return false;
            }
        };
        // When a click outside the form accurs, the form will not loose focus
        modalCover.onclick = function () { firstElement.focus() }

    }

    /**
     * Substribe to all of the topics.
     */
    #subscribeAll() {
        // for each topic subscribe with a function who's name is the topic name with a capital first letter
        // prepended with "on"
        // for example if topic == "projectAdded" then onTopic == "onProjectAdded"
        for (let topic in TOPICS) {
            let first = topic.charAt(0).toUpperCase();
            let onTopic = `on${first}${topic.substring(1)}`;
            this.subscribe(TOPICS[topic], this[onTopic].bind(this));
        }
    }

    subscribe(topic, callback) {
        pubsub.subscribe(topic, callback);
    }

    unsubscribe(topic, callback) {
        pubsub.unsubscribe(topic, callback);
    }





    clickCheckTodo(id) {
        this.#todoController.checkTodo(id);
    }

    clickSortProject(sortName) {
        this.#todoController.sortProject(sortName);
    }

    clickMoveTodoToProject(todoId, projectName) {
        this.#todoController.moveTodoToProject(todoId, projectName);
    }

    clickRemoveCheckedTodos() {
        this.#todoController.removeCheckedTodos();
    }




}
