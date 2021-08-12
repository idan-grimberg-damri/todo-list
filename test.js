import TodoModel from "./todo-model.js";
import TodoController from "./todo-controller.js";
import TodoView from "./todo-view.js";

const todoModel = new TodoModel();
const todoController = new TodoController(todoModel);
const todoView = new TodoView(todoController, todoModel);

todoView.clickAddProject("project 1");
console.log("after adding project 1, projects state now: " + todoModel.projects);
todoView.clickAddProject("project 2");
console.log("after adding project 2, projects state now: " + todoModel.projects);
todoView.clickAddProject("poject 3");
console.log("after adding project 3, projects state now: " + todoModel.projects);
todoView.clickRemoveProject("project 2");
console.log("after removeing project 2, projects state now: " + todoModel.projects);

todoView.clickAddTodo(todoModel.projects[1], "clean house", "Medium", "21/10/2021");
console.log("after adding todo to project 1, projects state now: ",todoModel.projects);

todoView.clickAddTodo(todoModel.projects[1], "suck cock", "High", "28/12/2021");
console.log("after adding todo to project 1, projects state now: ",todoModel.projects);

todoView.clickAddTodo(todoModel.projects[2], "see a movie", "Low", "11/11/2021");
console.log("after adding todo to project 3, projects state now: ",todoModel.projects);
todoModel.currentProject = "project 1";
todoView.clickRemoveTodo(1);
console.log("after delete todo with id 1, projects state now: ",todoModel.projects);



