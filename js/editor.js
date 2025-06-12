<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dachform Editor - Dachplattenrechner</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Dachplattenrechner</h1>
            <nav class="progress-nav">
                <div class="step completed" data-step="1">
                    <span class="step-number">1</span>
                    <span class="step-title">Profil</span>
                </div>
                <div class="step active" data-step="2">
                    <span class="step-number">2</span>
                    <span class="step-title">Dachform</span>
                </div>
                <div class="step" data-step="3">
                    <span class="step-number">3</span>
                    <span class="step-title">Berechnung</span>
                </div>
                <div class="step" data-step="4">
                    <span class="step-number">4</span>
                    <span class="step-title">Anrissplan</span>
                </div>
            </nav>
        </header>

        <main>
            <section class="roof-editor-section">
                <h2>Schritt 2: Dachform definieren</h2>
                <p>Wählen Sie eine Grundform und passen Sie diese an Ihre Bedürfnisse an:</p>

                <!-- Debug-Bereich -->
                <div id="debug-info" class="debug">
                    <strong>Debug-Info:</strong> <span id="debug-text">JavaScript wird getestet...</span>
                    <br><strong>Test:</strong> <button onclick="alert('JavaScript funktioniert!')">JavaScript Test</button>
                </div>

                <form id="roofForm">
                    <div class="card">
                        <h3>Grundform wählen</h3>
                        <div class="shape-grid">
                            <div class="shape-tile" data-shape="rechteck">
                                <canvas width="80" height="60" class="shape-icon"></canvas>
                                <span>Rechteck</span>
                            </div>
                            <div class="shape-tile" data-shape="dreieck">
                                <canvas width="80" height="60" class="shape-icon"></canvas>
                                <span>Dreieck</span>
                            </div>
                            <div class="shape-tile" data-shape="trapez">
                                <canvas width="80" height="60" class="shape-icon"></canvas>
                                <span>Trapez</span>
                            </div>
                            <div class="shape-tile" data-shape="l-form">
                                <canvas width="80" height="60" class="shape-icon"></canvas>
                                <span>L-Form</span>
                            </div>
                            <div class="shape-tile" data-shape="u-form">
                                <canvas width="80" height="60" class="shape-icon"></canvas>
                                <span>U-Form</span>
                            </div>
                        </div>

                        <div id="sub-form-group" class="sub-form-section" style="display: none;">
                            <h4 id="sub-form-title">Typ wählen:</h4>
                            <div id="sub-form-grid" class="shape-grid">
                                <!-- Dynamisch gefüllt -->
                            </div>
                        </div>
                    </div>

                    <div class="card" id="editor-section" style="display: none;">
                        <h3>Dachform anpassen & Vorschau</h3>
                        <div class="editor-container">
                            <div class="editor-canvas">
                                <canvas id="editor-canvas" width="400" height="300"></canvas>
                                <div class="editor-info">
                                    <p><strong>Anleitung:</strong> Klicken Sie auf die Seite, die zur Dachrinne (unten) zeigen soll</p>
                                </div>
                                <div id="dimensions-inputs-container">
                                    <h4>Abmessungen eingeben</h4>
                                    <div id="dimensions-inputs"></div>
                                </div>
                            </div>
                            <div class="editor-controls">
                                <div class="form-group">
                                    <label><input type="checkbox" id="spiegeln-lr"> Links/Rechts spiegeln</label>
                                </div>
                                <div class="selected-edge" id="selected-edge" style="display: none;">
                                    <p><strong>Trauf-Seite:</strong> <span id="edge-info">Keine ausgewählt</span></p>
                                </div>
                                <div id="roof-info" style="margin-top: 15px;"></div>
                            </div>
                        </div>
                    </div>
                </form>

                <div class="navigation-buttons">
                    <button type="button" class="btn btn-secondary" onclick="goBack()">
                        ← Zurück zum Profil
                    </button>
                    <button type="button" class="btn btn-primary" onclick="saveAndContinue()" id="continue-btn" disabled>
                        Weiter zur Berechnung →
                    </button>
                </div>
            </section>
        </main>

        <footer>
            <p>&copy; 2025 Dachplattenrechner</p>
        </footer>
    </div>
    <script src="editor.js"></script>
</body>
</html>
