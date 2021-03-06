import React, { Component } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { MapInteractionCSS } from "react-map-interaction";
import { Scrollbars } from "react-custom-scrollbars";
import PropTypes from "prop-types";
import {
  Accordion,
  Card,
  Container,
  Row,
  Col,
  Nav,
  Navbar,
  NavDropdown,
  Badge,
  Spinner,
} from "react-bootstrap";

function NarratorList(props) {
  // Return a list of badges with Character's name and color
  // Use white text if specified in use_white_text
  const { narratingCharacters } = props;
  return (
    <div>
      {narratingCharacters.map((character) => (
        <span>
          <Badge
            style={{
              background: character.color,
              color: character.use_white_text ? "white" : "black",
            }}
            key={character.id}
          >
            {character.display_name}
          </Badge>
          &nbsp;
        </span>
      ))}
    </div>
  );
}

class Map extends React.Component {
  drawX(x, y, ctx) {
    ctx.beginPath();

    ctx.moveTo(x - 5.5, y - 5.5);
    ctx.lineTo(x + 5.5, y + 5.5);

    ctx.moveTo(x + 5.5, y - 5.5);
    ctx.lineTo(x - 5.5, y + 5.5);
    ctx.stroke();
  }

  componentDidMount() {
    const { canvas } = this.refs;
    const ctx = canvas.getContext("2d");
    const { img } = this.refs;

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.narrators !== this.props.narrators;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Have to re-define canvas for some reason
    const { canvas } = this.refs;
    const ctx = canvas.getContext("2d");
    const { img } = this.refs;

    // setup image
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.drawImage(img, 0, 0);
    ctx.stroke();

    // setup individual stroke
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    ctx.lineCap = "round";

    // Draw on the map using canvas, point, and narrators
    const { narrators, narratingCharacters } = this.props;
    if (narrators !== {}) {
      // For each narrator, do
      for (const [id, narrator] of Object.entries(narrators)) {
        console.log(`DEBUG: narrator id:${id}`);

        // Set Point color based on narratingCharacter's color
        const colorOfCharacter = Object.values(
          narratingCharacters.filter(
            (character) => character.id === narrator.character
          )
        )[0].color;
        ctx.strokeStyle = colorOfCharacter;
        console.log("DEBUG: CharacterColor: ");
        console.log(colorOfCharacter);
        const pointLenght = Object.keys(narrator.points).length;

        // For each point, do
        for (const [pointId, point] of Object.entries(narrator.points)) {
          console.log(`DEBUG:  point id:${id}`);
          const { x } = point;
          const { y } = point;
          if (pointLenght === 1) {
            // If there is only one point, draw rectangle
            ctx.moveTo(x, y);
            ctx.beginPath();
            ctx.rect(x - 5, y - 5, 10, 10);
            ctx.stroke();
          } else if (parseInt(pointId) === pointLenght - 1) {
            // Draw rectangle the final point
            ctx.lineTo(x, y);
            ctx.stroke();
            this.drawX(x, y, ctx);
          } else if (parseInt(pointId) === 0) {
            // Draw a circle on the first point
            ctx.moveTo(x, y);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.moveTo(x, y);
            ctx.stroke();
          } else {
            // Draw a line on other points
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          console.log(point);
        }
      }
    }
  }

  render() {
    const imageUrl = require("./images/map-grayscale.jpg");
    const height = 3374;
    const width = 2427;
    const { scale, translation } = this.props;
    return (
      <MapInteractionCSS
        scale={scale}
        translation={translation}
        onChange={({ scale, translation }) =>
          this.setState({ scale, translation })
        }
      >
        <div>
          <canvas ref="canvas" width={height} height={width} />
          <img ref="img" alt="map" src={imageUrl} className="hidden" />
        </div>
      </MapInteractionCSS>
    );
  }
}

Map.propTypes = {
  narrators: PropTypes.array,
  scale: PropTypes.number,
  translation: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
};

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentBook: {},
      chapters: [],
      currentChapter: {},
      scale: 0.35,
      translation: {
        x: 15,
        y: 15,
      },
      narratingCharacters: {},
    };
  }

  lookupCharacter(chapter_id) {
    // Receive chapter_id
    // Return a list of narrators that appear in the Chapter
    const { characters } = this.props;

    // Filter only Character that appears in the currentChapter
    let matchedCharacters = characters.filter((character) => {
      const narrators = Object.values(character.narrators);
      for (const narrator of narrators) {
        // Lookup with chapter_id, return on match found
        if (narrator.chapter === chapter_id) return true;
      }
      return false;
    });

    // Return a list of Character object
    return matchedCharacters;
  }

  onBookSelected(book_number = 1) {
    // onBookSelected, set this.state.currentBook to selection value
    // ChapterList will be updated via props change
    //
    console.log(book_number);
    const { books } = this.props;
    const currentBook = books.filter(
      (book) => book.book_number === parseInt(book_number)
    )[0];
    console.log("DEBUG: currentBook");
    console.log(currentBook);

    this.setState({
      currentBook: currentBook,
      chapters: currentBook.chapters,
    });
  }

  onChapterSelected(chapter) {
    // onChapterSelected, translation and scale are calculated
    // To make every Point from the currentChapter visible on the map
    // this.state.currentChapter is set to calculated value
    let position = {
      x: 0,
      y: 0,
    };
    // Scale on zoomed map
    const scale = 1.2;
    // Loop through a list of Narrator and Points
    // To calculate where the Map should jump to
    // (x, y) from Points are averaged then divide by 3.0
    const narrators = Object.values(chapter.narrators);
    for (const narrator of narrators) {
      // TODO Make this works with multiple narrators
      const points = Object.values(narrator.points);
      for (const point of points) {
        position.x += point.x;
        position.y += point.y;
      }
      position.x = Math.round(-(position.x / points.length) / 1.2);
      position.y = Math.round(-(position.y / points.length) / 1.2);
      break;
    }

    // Lookup narratingCharacters for the currentChapter
    const narratingCharacters = this.lookupCharacter(chapter.id);
    console.log("DEBUG: Looked up Characters:");
    console.log(narratingCharacters);

    // Update Chapter's state
    this.setState({
      currentChapter: chapter,
      scale: scale,
      translation: position,
      narratingCharacters: narratingCharacters,
    });

    // const { scrollbars } = this.refs;
    // scrollbars.scrollTop(45 * chapter.chapter_number);
  }

  render() {
    const { books } = this.props;
    const {
      chapters,
      currentBook,
      currentChapter,
      scale,
      translation,
      narratingCharacters,
    } = this.state;
    return (
      <div>
        <Navbar bg="dark" variant="dark" expand="lg" className="waygate-navbar">
          <Navbar.Brand href="#home">
            Waygate - The Wheel of Time Interactive Map
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="http://127.0.0.1:8000/api">API</Nav.Link>
              <Nav.Link href="http://127.0.0.1:8000/docs">Docs</Nav.Link>
              <Nav.Link href="http://127.0.0.1:8000/admin" variant="warning">
                Admin
              </Nav.Link>
              <NavDropdown title="Resources" id="basic-nav-dropdown">
                <NavDropdown.Item href="https://wot.fandom.com/wiki/A_beginning">
                  The Wheel of Time Wiki
                </NavDropdown.Item>
                <NavDropdown.Item href="https://dragonmount.com/books/index/">
                  Dragonmount
                </NavDropdown.Item>
                <NavDropdown.Item href="https://www.tarvalon.net/index.php?pages/Library/">
                  Tar Valon Library
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="https://dragonmount.com/store/category/8-robert-jordan-ebooks/">
                  Buy The Wheel of Time E-books
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Nav>
              <NavDropdown
                title={
                  currentBook.book_name
                    ? currentBook.book_number + " - " + currentBook.book_name
                    : "Select book"
                }
                id="dropdown-select-book"
                drop="left"
                menuRole="menu"
                onSelect={(e) => this.onBookSelected(e)}
              >
                {books.map((book) => (
                  <NavDropdown.Item eventKey={book.book_number}>
                    Book {book.book_number} - {book.book_name}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Row>
          <Col lg={9} md={12}>
            <div className="waygate-map-container">
              <Map
                narrators={currentChapter.narrators}
                scale={scale}
                translation={translation}
                narratingCharacters={narratingCharacters}
              />
            </div>
          </Col>
          <Col lg={3} md={12}>
            <Scrollbars ref="scrollbars" className="waygate-scrollbars">
              <Accordion>
                {chapters.map((chapter) => (
                  <Card key={chapter.chapter_number}>
                    <Accordion.Toggle
                      as={Card.Header}
                      eventKey={chapter.chapter_number}
                      onClick={() => this.onChapterSelected(chapter)}
                      className="waygate-chapter-header"
                    >
                      <h5>
                        <Badge variant="dark">
                          Chapter {chapter.chapter_number}
                        </Badge>
                        &nbsp;
                        {chapter.chapter_name}
                      </h5>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey={chapter.chapter_number}>
                      <Card.Body className="waygate-chapter-body">
                        <h4>{chapter.chapter_name}</h4>
                        <Badge variant="info">{chapter.period}</Badge>
                        <NarratorList
                          narratingCharacters={this.lookupCharacter(chapter.id)}
                        />
                        <p>{chapter.summary}</p>
                      </Card.Body>
                    </Accordion.Collapse>
                  </Card>
                ))}
              </Accordion>
            </Scrollbars>
          </Col>
        </Row>
      </div>
    );
  }
}

Main.propTypes = {
  chapters: PropTypes.array,
};

class App extends Component {
  // base component is used to fetch api data
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      books: [],
      characters: [],
    };
  }

  componentDidMount() {
    let url;

    // Fetch books data
    url = "http://127.0.0.1:8000/api/book";
    fetch(url)
      .then((res) => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            books: result,
          });
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        }
      );

    // Fetch characters data
    url = "http://127.0.0.1:8000/api/character";
    fetch(url)
      .then((res) => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            characters: result,
          });
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        }
      );
  }

  render() {
    const { error, isLoaded, books, characters } = this.state;
    if (error) {
      return (
        <div>
          Error:
          {error.message}
        </div>
      );
    }
    if (!isLoaded) {
      return <Spinner animation="border" />;
    }
    return (
      <div className="App">
        <Container fluid className="waygate-app-container">
          <Main books={books} characters={characters} />
        </Container>
      </div>
    );
  }
}

export default App;
