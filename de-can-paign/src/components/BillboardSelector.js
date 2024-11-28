import "./BillboardSelector.css"; // Import the CSS file

const billboards = [
  { id: 1, name: "pele", src: "/images/pele.jpg" },
  { id: 2, name: "simecka", src: "/images/simecka.jpg" },
];

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
