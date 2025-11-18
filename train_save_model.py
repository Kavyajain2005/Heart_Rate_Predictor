import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# Synthetic datasets generation functions
def generate_steady_state(seq_len=1000):
    return np.full(seq_len, 65) + np.random.normal(scale=0.5, size=seq_len)

def generate_changing_state(seq_len=1000):
    t = np.linspace(0, 10 * np.pi, seq_len)
    return 60 + 10 * np.sin(t) + np.random.normal(scale=2.0, size=seq_len)

def generate_random_fluctuations(seq_len=1000):
    base = np.linspace(60, 70, seq_len)
    noise = np.random.normal(scale=3.0, size=seq_len)
    return base + noise

def combine_datasets(*datasets):
    return np.concatenate(datasets)

def create_dataset(data, window_size=50):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(X), np.array(y)

def build_advanced_model(input_shape):
    model = Sequential()
    model.add(Bidirectional(LSTM(128, return_sequences=True), input_shape=input_shape))
    model.add(Dropout(0.3))
    model.add(Bidirectional(LSTM(64)))
    model.add(Dropout(0.2))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

# Generate and combine data
data_steady = generate_steady_state()
data_changing = generate_changing_state()
data_fluctuations = generate_random_fluctuations()
combined_data = combine_datasets(data_steady, data_changing, data_fluctuations)

X, y = create_dataset(combined_data)
X = X.reshape((X.shape[0], X.shape[1], 1))

model = build_advanced_model((X.shape[1], 1))

early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5)

print("Training the model...")
model.fit(X, y, epochs=50, batch_size=32, validation_split=0.2,
          callbacks=[early_stop, reduce_lr], verbose=1)

model.save('hr_predictor_model.h5')
print("Model saved as hr_predictor_model.h5")
