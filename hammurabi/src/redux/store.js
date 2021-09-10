import { createStore } from "redux"

const defaultState = {
    // Video rendering
    comments: [],
    question: null,
    processed: null,
    song: null,
    theme: null,

    // Dashboard
    credits: null,
    themes: [],
    videos: [],
    songs: [],

    user: {},

    // If Admin
    users: [],

    loggedIn: localStorage.getItem("loggedIn") === "true",
}

function state(state = defaultState, action) {
    switch (action.type) {
        case "RESET_VIDEOSTATE":
            return {
                ...state,
                question: null,
                processed: null,
                comments: [],
                theme: state.themes[0] ? state.themes[0]._id : undefined,
                song: null,
            }
        case "SET_COMMENTS":
            return Object.assign({}, state, {
                comments: action.val,
            })
        case "SET_USER":
            return Object.assign({}, state, {
                user: action.val,
            })
        case "SET_USERS":
            return Object.assign({}, state, {
                users: action.val,
            })
        case "SET_PROCESSED":
            return Object.assign({}, state, {
                processed: action.val,
            })
        case "SET_QUESTION":
            return Object.assign({}, state, {
                question: action.val,
            })
        case "SET_TITLE": {
            let question = Object.assign({}, state.question, {
                title: action.val,
            })
            return Object.assign({}, state, {
                question: question,
            })
        }
        case "SET_SELFTEXT": {
            let question = Object.assign({}, state.question, {
                selftext_html: action.val,
            })
            return Object.assign({}, state, {
                question,
            })
        }
        case "SET_INCLUDE_SELFTEXT": {
            let question = Object.assign({}, state.question, {
                includeSelftext: action.val,
            })
            return Object.assign({}, state, {
                question,
            })
        }
        case "SET_THEME":
            return Object.assign({}, state, {
                theme: action.val,
            })
        case "SET_SONG":
            return Object.assign({}, state, {
                song: action.val,
            })
        case "SET_CREDITS":
            return Object.assign({}, state, {
                credits: action.val,
            })
        case "SET_THEMES":
            return Object.assign({}, state, {
                themes: action.val,
            })
        case "SET_SONGS":
            return Object.assign({}, state, {
                songs: action.val,
            })
        case "SET_VIDEOS":
            return Object.assign({}, state, {
                videos: action.val,
            })
        case "LOGIN":
            localStorage.setItem("loggedIn", "true")
            return Object.assign({}, state, {
                loggedIn: true,
            })
        case "LOGOUT":
            localStorage.removeItem("loggedIn")
            return Object.assign({}, state, {
                loggedIn: false,
            })
        default:
            return state
    }
}

export default process.env.NODE_ENV === "development"
    ? createStore(
          state,
          window.__REDUX_DEVTOOLS_EXTENSION__ &&
              window.__REDUX_DEVTOOLS_EXTENSION__()
      )
    : createStore(state)
