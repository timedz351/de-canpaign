import "./BillboardSelector.css";

const billboards = [
  { id: 1, name: "Pellegrini", src: "/images/pele.jpg" },
  { id: 2, name: "Šimečka", src: "/images/simecka.jpg" },
  { id: 3, name: "Fico", src: "/images/fico.png" },
  { id: 4, name: "Uhrík", src: "/images/uhrik.png" },
  { id: 5, name: "Matovič", src: "/images/matovic.png" },
  { id: 6, name: "Babiš", src: "/images/babis.png" },
];

// eslint-disable-next-line react/prop-types
const BillboardSelector = ({ onSelect }) => {
  return (
    <div className="billboard-selector">
      {billboards.map((billboard) => (
        <div
          key={billboard.id}
          className="billboard-item"
          onClick={() => onSelect(billboard.src)}
        >
          <div className="billboard-image-wrapper">
            <img
              src={billboard.src}
              alt={billboard.name}
              className="billboard-image"
            />
          </div>
          <p className="billboard-name">{billboard.name}</p>
        </div>
      ))}
    </div>
  );
};

export default BillboardSelector;