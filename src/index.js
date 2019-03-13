import React from "react"
import ReactDOM from "react-dom"
import * as serviceWorker from "./serviceWorker"

// Создание хранилища
const createStore = (reducer, initialState = []) => {
  let currentState = initialState
  let listeners = []

  const getState = () => currentState
  const dispatch = action => {
    currentState = reducer(currentState, action)
    listeners.forEach(listener => listener())
    return action
  }
  // подписка на хранилище
  const subscribe = listener => {
    listeners.push(listener)
    // отписка
    return () => {
      const index = listeners.indexOf(listener)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    }
  }
  return { getState, dispatch, subscribe }
}


// Обертка HOC для возможности взаимодействия с хранилищем
const connect = (mapStateToProps, mapDispatchToProps) => Component => {
  return class extends React.Component {
    render() {
      const store = window.store
      return (
        <Component
          {...this.props}
          {...mapStateToProps(store.getState(), this.props)}
          {...mapDispatchToProps(store.dispatch, this.props)}
        />
      )
    }

    componentDidMount() {
      const store = window.store
      this.unsubscribe = store.subscribe(this.handleChange)
    }

    componentWillUnmount() {
      this.unsubscribe()
    }

    handleChange = () => this.forceUpdate()
  }
}


// Провайдер хранилища
class Provider extends React.Component {
  componentWillMount() {
    window.store = this.props.store
  }

  render() {
    return this.props.children
  }
}



// Actions
const ADD_TODO = "ADD_TODO"


// Action creators
const addTodo = todo => ({
  type: ADD_TODO,
  payload: todo
})


// Reducers
const reducer = (state = [], action) => {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload]
    default:
      return state
  }
}


// Components
class ToDoComponent extends React.Component {
  state = {
    todoText: ""
  }

  render() {
    const { title = "Без названия", todos = [] } = this.props
    const { todoText = "" } = this.state
    return (
      <form onSubmit={this.handleSubmit}>
        <label htmlFor="todoText">{title}</label>
        <div>
          <input
            id="todoText"
            name="todoText"
            value={todoText}
            placeholder="Название задачи"
            onChange={this.handleInputChange}
          />
          <button type="submit">Добавить</button>
          <ul>
            {Array.isArray(todos) &&
              todos.map((todo, idx) => <li key={idx}>{todo}</li>)}
          </ul>
        </div>
      </form>
    )
  }

  handleSubmit = e => {
    e.preventDefault()
    this.addTodo()
  }

  handleInputChange = e => {
    const { value } = e.target
    this.setState({ ...this.state, todoText: value })
  }

  addTodo = () => {
    this.props.addTodo(this.state.todoText)
    this.setState({ ...this.state, todoText: "" })
  }
}

// Процесс обертки HOC
const ToDo = connect(
  state => ({
    todos: state
  }),
  dispatch => ({
    addTodo: text => dispatch(addTodo(text))
  })
)(ToDoComponent)


// Инициализация
const store = createStore(reducer, [])
ReactDOM.render(
  <Provider store={store}>
    <ToDo title="Список задач" />
  </Provider>,
  document.getElementById("app")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
