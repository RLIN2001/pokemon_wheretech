import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";

const Modal = ({ isOpen, onClose, pokemon, onCatch }) => {
	if (!isOpen) return null;

	return (
		<div style={modalStyles.overlay}>
			<div style={modalStyles.modal}>
				<h2>{pokemon.name}</h2>
				<img src={pokemon.image} alt={pokemon.name} style={modalStyles.image} />
				<div style={modalStyles.buttonContainer}>
					<button onClick={onClose}>Scappa</button>
					<button onClick={onCatch}>Cattura</button>
				</div>
			</div>
		</div>
	);
};

const modalStyles = {
	overlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	modal: {
		backgroundColor: "white",
		padding: "20px",
		borderRadius: "8px",
		textAlign: "center",
	},
	image: {
		width: "100px",
		height: "100px",
	},
	buttonContainer: {
		marginTop: "20px",
		display: "flex",
		justifyContent: "space-around",
	},
};

export default function GamePage() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();
	const [map, setMap] = useState([]);
	const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
	const [modalOpen, setModalOpen] = useState(false);
	const [pokemon, setPokemon] = useState(null);
	const [caughtPokemons, setCaughtPokemons] = useState([]);

	const onSubmit = (data) => {
		const newMap = generateMap(data.sea, data.grass, +data.mapSize);
		setMap(newMap);
		setPlayerPosition({
			x: Math.sqrt(newMap.length) / 2,
			y: Math.sqrt(newMap.length) / 2,
		});
		setCaughtPokemons([]);
	};

	const generateMap = (seaPercentage, grassPercentage, mapSize) => {
		const totalCells = mapSize;
		const seaCount = Math.floor((seaPercentage / 100) * totalCells);
		const grassCount = Math.floor((grassPercentage / 100) * totalCells);

		const newMap = Array(totalCells)
			.fill("Land")
			.map((cell, index) => {
				if (index < seaCount) return "Sea";
				if (index < seaCount + grassCount) return "Grass";
				return "Land";
			});
		return newMap.sort(() => Math.random() - 0.5);
	};

	const handleKeyDown = useCallback(
		(event) => {
			setPlayerPosition((prev) => {
				let newPos = { ...prev };
				const gridSize = Math.sqrt(map.length);

				switch (event.key) {
					case "ArrowUp":
						if (prev.y > 0) newPos.y--;
						break;
					case "ArrowDown":
						if (prev.y < gridSize - 1) newPos.y++;
						break;
					case "ArrowLeft":
						if (prev.x > 0) newPos.x--;
						break;
					case "ArrowRight":
						if (prev.x < gridSize - 1) newPos.x++;
						break;
					default:
						return prev;
				}

				const newCellType = map[newPos.y * gridSize + newPos.x];
				if (newCellType === "Grass" && calculateIfPokemonFound()) {
					fetchPokemon();
				}

				return newCellType === "Sea" ? prev : newPos;
			});
		},
		[map]
	);

	const calculateIfPokemonFound = () => Math.random() < 0.2;

	const fetchPokemon = async () => {
		const randomId = Math.floor(Math.random() * 898) + 1;
		try {
			const response = await fetch(
				`https://pokeapi.co/api/v2/pokemon/${randomId}`
			);
			if (!response.ok) throw new Error("Errore nel recupero del Pokémon");
			const data = await response.json();
			setPokemon({ name: data.name, image: data.sprites.front_default });
			setModalOpen(true);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (!modalOpen) {
			const keyDownHandler = (event) => handleKeyDown(event);
			window.addEventListener("keydown", keyDownHandler);
			return () => window.removeEventListener("keydown", keyDownHandler);
		}
	}, [map, modalOpen]);

	const gridSize = Math.sqrt(map.length);

	return (
		<>
			<h1 style={styles.header}>Pokemon WhereTech</h1>
			<div style={styles.centered}>
				<h2 style={styles.subHeader}>
					Inserisci i parametri iniziali per iniziare il gioco
				</h2>
				<form onSubmit={handleSubmit(onSubmit)}>
					<h3 style={styles.bold}>
						Parametri impostabili (valori tra 10% e 30%):
					</h3>
					{["sea", "grass"].map((field) => (
						<div key={field} style={styles.inputContainer}>
							<label htmlFor={field}>
								{field === "sea" ? "Mare %:" : "Erba %:"}
							</label>
							<input
								type="number"
								required
								id={field}
								style={styles.input}
								min={10}
								max={30}
								{...register(field, { required: "Il campo è obbligatorio" })}
							/>
							{errors[field] && (
								<span style={styles.error}>{errors[field].message}</span>
							)}
						</div>
					))}
					<div style={styles.mapSizeContainer}>
						<h3>Dimensioni della mappa:</h3>
						<select {...register("mapSize")} required>
							<option value={100}>Piccola (10x10)</option>
							<option value={500}>Media (25x20)</option>
							<option value={1000}>Grande (40x25)</option>
						</select>
					</div>
					<br />
					<button type="submit">Genera mappa</button>
					{caughtPokemons.length > 0 && (
						<button
							type="button"
							onClick={() =>
								alert(
									`Hai catturato ${
										caughtPokemons.length
									} Pokémon!\n${caughtPokemons.map((p) => p.name).join(", ")}`
								)
							}
						>
							Catturati
						</button>
					)}
				</form>
			</div>
			<div style={styles.grid(gridSize)}>
				{map.map((cell, index) => {
					const isPlayer =
						playerPosition.x === index % gridSize &&
						playerPosition.y === Math.floor(index / gridSize);
					return (
						<div key={index} style={styles.cell(isPlayer, cell)}>
							{isPlayer ? "🧑" : ""}
						</div>
					);
				})}
			</div>
			{pokemon && modalOpen && (
				<Modal
					isOpen={modalOpen}
					onClose={() => setModalOpen(false)}
					onCatch={() => {
						setCaughtPokemons([...caughtPokemons, pokemon]);
						setModalOpen(false);
						setTimeout(
							() => alert("Hai ottenuto il Pokémon: " + pokemon.name),
							500
						);
					}}
					pokemon={pokemon}
				/>
			)}
		</>
	);
}

const styles = {
	header: {
		textAlign: "center",
		color: "white",
		fontSize: "3em",
		marginTop: "20px",
		padding: "2em",
		background: "grey",
	},
	centered: {
		textAlign: "center",
	},
	subHeader: {
		color: "green",
	},
	bold: {
		fontWeight: "bold",
	},
	inputContainer: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		marginTop: "50px",
		gap: "10px",
	},
	input: {
		width: "15%",
	},
	error: {
		color: "red",
		fontSize: "0.8em",
		marginTop: "5px",
	},
	mapSizeContainer: {
		marginTop: "50px",
		textAlign: "center",
	},
	grid: (gridSize) => ({
		display: "grid",
		gridTemplateColumns: `repeat(${gridSize}, 50px)`,
		margin: "20px auto",
		justifyContent: "center",
	}),
	cell: (isPlayer, cell) => ({
		width: "50px",
		height: "50px",
		backgroundColor: isPlayer
			? "red"
			: cell === "Sea"
			? "blue"
			: cell === "Grass"
			? "green"
			: "brown",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		color: "white",
	}),
};
