from flask import Flask, request, jsonify, render_template
import numpy as np
import tensorflow as tf

app = Flask(__name__)

print("Loading model...")
model = tf.keras.models.load_model('hr_predictor_model.h5')
print("Model loaded. Ready to serve predictions.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    seq = data.get('sequence', [])
    if len(seq) != 50:
        return jsonify({'error': 'Input sequence must be length 50'}), 400
    try:
        input_data = np.array(seq).reshape((1, 50, 1))
        pred_hr = model.predict(input_data)[0, 0]
        return jsonify({'predicted_heart_rate': float(pred_hr)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)