import Firebase from "./FirebaseAPI";
import NoteList from "./NoteList";
import CarProfile from "./CarProfile";
import { click, modal } from "../constants/constants";

class NoteModView {
  constructor(overlay) {
    this.overlay = overlay;
    this.container = null;
    this.description = null;
    this.costWork = null;
    this.mileage = null;
    this.buttonSave = null;
    this.partsList = null;
    this.date = null;
  }

  render() {
    return ` <div class="modal-window note-mod">
    <span class=" close close-note-mod">&#10006;</span>
    <div class="info-block">
    <h2 class="date">${new Date().toDateString()}</h2>
    <label> Выполненые работы:
    <textarea cols="50" rows="10" class="info-work-input description" placeholder="Описание выполненных работ..."/></textarea>
  </label>
  <label>Стоимость работ:
  <input type="number" class="info-work-input cost-work" placeholder="Введите стоимость работ"/>
  </label>
  <label>Пробег:
  <input type="number" class="info-work-input mileage" placeholder="Введите текущий пробег"/>
  </label>
  </div>
  <div class="info-block info-parts">
  <label> Номер запчасти:
    <input type="text" class="info-parts-input parts-number" placeholder="Введите номер запчасти"/>
  </label>
  <label>Название запчасти:
    <input type="text" class="info-parts-input parts-name" placeholder="Введите название запчасти "/>
  </label>
  <label> Стоимость:
    <input type="number" class="info-parts-input cost-parts " placeholder="Введите стоимость запчасти"/>
  </label>
  <label> Производитель:
    <input type="text" class="info-parts-input parts-brand" placeholder="Введите бренд запчасти"/>
  </label> 
  <button class="btn add-parts" disabled>Добавить</button>
  </div>
  <ol class ="parts-list">Запчасти:</ol>
  <button class="btn button-save-note" disabled>Сохранить</button>
    </div>`;
  }

  showModalWindow(data = null) {
    this.container = document.querySelector(".note-mod");
    this.description = document.querySelector(".description");
    this.costWork = document.querySelector(".cost-work");
    this.mileage = document.querySelector(".mileage");
    this.partsList = this.container.querySelector(".parts-list");
    this.buttonSave = document.querySelector(".button-save-note");
    this.date = document.querySelector(".date");

    if (data) {
      const string = data.list;
      const newPartsList = new DOMParser()
        .parseFromString(string, "text/html")
        .querySelector(".parts-list");

      const arr = newPartsList.querySelectorAll("li");

      arr.forEach((el) =>
        el.insertAdjacentHTML(
          "beforeend",
          `<button class="btn button-remove">Удалить</button>`
        )
      );

      this.date.textContent = new Date(data.timestamp).toDateString();
      this.description.value = data.description;
      this.costWork.value = data.cost;
      this.mileage.value = data.mileage;

      this.buttonSave.classList.add("update");
      this.buttonSave.setAttribute("data-id", data.id);
      this.partsList.replaceWith(newPartsList);
    }

    this.container.classList.add("modal-window_open");
    this.overlay.classList.add("active");
  }

  setDisabled(state, item) {
    item.disabled = state;
  }

  createPartsListItem(data) {
    return `<li class= "list-item" id=${data.id}><span>${data.name} </span><span>${data.number} </span><span>${data.brand} </span><span>${data.cost} руб.</span>
    <button class="btn button-remove">Удалить</button></li>
    `;
  }

  cleanInfoParts() {
    const arr = document.querySelectorAll(".info-parts-input");
    arr.forEach((el) => {
      el.value = "";
    });
  }

  renderPartsListItem(data) {
    const list = this.container.querySelector(".parts-list");
    const item = this.createPartsListItem(data);

    list.insertAdjacentHTML("beforeend", item);

    this.cleanInfoParts();
  }

  removeItem(item) {
    item.remove();
  }

  renderNoteBlock(data) {
    NoteList.view.renderNoteBlock(data);
    CarProfile.view.renderUpdateMileage(data);
  }

  updateNoteBlock(data) {
    NoteList.view.updateNoteBlock(data);
    CarProfile.view.renderUpdateMileage(data);
  }

  closeModalWindow() {
    this.setDisabled(true, this.buttonSave);
    this.container.classList.remove("modal-window_open");
    this.overlay.classList.remove("active");
  }

  cleanModalWindow() {
    const arr = this.container.querySelectorAll(".info-work-input");
    const list = this.container.querySelector(".parts-list");

    list.innerHTML = "";
    arr.forEach((el) => {
      el.value = "";
    });
  }
}

class NoteModModel {
  constructor(view) {
    this.view = view;
  }

  setDisabled(state, item) {
    this.view.setDisabled(state, item);
  }

  createPartsListItem(data) {
    this.view.renderPartsListItem(data);
  }

  async createPart(data) {
    const snapshot = await Firebase.getItemsArr(
      `${Firebase.pathUserCars}/${data.profileId}/parts`
    );
    const lastId = snapshot.docs[snapshot.docs.length - 1]?.id;
    if (!lastId) {
      data.id = "part1";
    } else {
      const index = Number(lastId[lastId.length - 1]) + 1;
      data.id = "part" + index;
    }

    await Firebase.createItem(
      data.id,
      data,
      `${Firebase.pathUserCars}/${data.profileId}/parts`
    );
    this.createPartsListItem(data);
  }

  removeItem(item, profileId) {
    this.view.removeItem(item);
    Firebase.deleteItem(item.id, `${Firebase.pathUserCars}/${profileId}/parts`);
  }

  async createNote(data) {
    if (!data.id) {
      data.id = "note1";
    } else {
      const index = Number(data.id[data.id.length - 1]) + 1;
      data.id = "note" + index;
    }

    await Firebase.createItem(
      data.id,
      data,
      `${Firebase.pathUserCars}/${data.profileId}/notes`
    );

    await Firebase.updateFieldDoc(data.profileId, { mileage: data.mileage });

    this.view.renderNoteBlock(data);
  }

  async updateNote(data) {
    await Firebase.createItem(
      data.id,
      data,
      `${Firebase.pathUserCars}/${data.profileId}/notes`
    );

    await Firebase.updateFieldDoc(data.profileId, { mileage: data.mileage });
    this.view.updateNoteBlock(data);
  }

  closeModalWindow() {
    this.view.closeModalWindow();
  }

  cleanModalWindow() {
    this.view.cleanModalWindow();
  }
}

class NoteModController {
  constructor(model, root) {
    this.model = model;
    this.root = root;

    this.partsNumber = null;
    this.partsName = null;
    this.costParts = null;
    this.partsBrand = null;
    this.buttonAdd = null;

    this.description = null;
    this.costWork = null;
    this.mileage = null;
    this.buttonSave = null;

    this.container = null;

    this.profileId = null;

    this.addListeners();
  }

  addListeners() {
    this.root.addEventListener("click", (event) => this.clickHandler(event));
    this.root.addEventListener("input", (event) => this.inputHandler(event));
  }

  inputHandler(event) {
    this.description = document.querySelector(".description");
    this.costWork = document.querySelector(".cost-work");
    this.mileage = document.querySelector(".mileage");
    this.buttonSave = document.querySelector(".button-save-note");

    this.buttonAdd = document.querySelector(".add-parts");
    this.partsNumber = document.querySelector(".parts-number");
    this.partsName = document.querySelector(".parts-name");
    this.costParts = document.querySelector(".cost-parts");
    this.partsBrand = document.querySelector(".parts-brand");

    if (document.querySelector(".note-mod")) {
      if (
        this.partsNumber.value &&
        this.partsName.value &&
        this.costParts.value &&
        this.partsBrand.value
      ) {
        this.model.setDisabled(false, this.buttonAdd);
      } else {
        this.model.setDisabled(true, this.buttonAdd);
      }

      if (this.description.value && this.costWork.value && this.mileage.value) {
        this.model.setDisabled(false, this.buttonSave);
      } else {
        this.model.setDisabled(true, this.buttonSave);
      }
    }
  }

  clickHandler(event) {
    const buttonAdd = event.target.closest(".add-parts");
    const buttonRemove = event.target.closest(".button-remove");
    const buttonSave = event.target.closest(".button-save-note");
    const arrNotes = document.querySelectorAll(".note-block");
    const closeIcon = event.target.closest(".close-note-mod");

    const lastId = arrNotes[arrNotes.length - 1]?.getAttribute("id");

    this.profileId = document.querySelector(".profile")?.id;

    if (buttonAdd) {
      const data = {
        number: this.partsNumber.value,
        name: this.partsName.value,
        cost: this.costParts.value,
        brand: this.partsBrand.value,
        profileId: this.profileId,
        timestamp: Date.now(),
      };

      this.model.createPart(data);
      this.model.setDisabled(true, this.buttonAdd);
      if (!document.querySelector(".soundOff")) {
        click.play();
      }
    }

    if (buttonRemove) {
      const item = event.target.closest(".list-item");
      this.model.removeItem(item, this.profileId);
      if (!document.querySelector(".soundOff")) {
        click.play();
      }
    }

    if (buttonSave) {
      this.container = document.querySelector(".modal-window");
      const partsList = this.container.querySelector(".parts-list");
      partsList.querySelectorAll(".button-remove").forEach((el) => el.remove());

      const data = {
        description: this.description.value,
        cost: this.costWork.value,
        mileage: this.mileage.value,
        list: partsList.outerHTML,
        profileId: this.profileId,
        timestamp: Date.now(),
        id: lastId,
      };

      if (buttonSave.classList.contains("update")) {
        data.id = buttonSave.getAttribute("data-id");

        this.model.updateNote(data);
        if (!document.querySelector(".soundOff")) {
          modal.play();
        }
      } else {
        this.model.createNote(data);
        if (!document.querySelector(".soundOff")) {
          modal.play();
        }
      }

      this.model.closeModalWindow();
      this.model.cleanModalWindow();
    }

    if (closeIcon) {
      this.model.closeModalWindow();
      this.model.cleanModalWindow();
      if (!document.querySelector(".soundOff")) {
        click.play();
      }
    }
  }
}

class NoteModMain {
  constructor() {
    this.view = new NoteModView(document.querySelector("#overlay"));
    this.model = new NoteModModel(this.view);
    this.controller = new NoteModController(
      this.model,
      document.querySelector("#root")
    );
  }

  render() {
    return this.view.render();
  }
}

const ModalWindowNoteMod = new NoteModMain();
export default ModalWindowNoteMod;
